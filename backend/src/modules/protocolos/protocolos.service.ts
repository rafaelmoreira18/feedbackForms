import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  ProtocoloEntity,
  ProtocoloStage,
  BlocoKey,
  BlocoTriagem,
  BlocoEcg,
  BlocoInvestigacao,
  BlocoDesfecho,
  EncerramentoProtocolo,
} from './entities/protocolo.entity';
import { TenantService } from '../tenants/tenant.service';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { SubmitBlocoTriagemDto } from './dto/submit-bloco-triagem.dto';
import { SubmitBlocoEcgDto } from './dto/submit-bloco-ecg.dto';
import { SubmitBlocoInvestigacaoDto } from './dto/submit-bloco-investigacao.dto';
import { SubmitBlocoDesfechoDto } from './dto/submit-bloco-desfecho.dto';
import { EncerrarProtocoloDto } from './dto/encerrar-protocolo.dto';
import { FilterProtocoloDto } from './dto/filter-protocolo.dto';
import { toSlug, deltaMin } from './utils/slug-time.util';
import { mergeBloco, diffCampos } from './utils/bloco-diff.util';
import { indicador, type Indicador } from './utils/indicador.util';

/** Próxima etapa após fechar cada bloco. */
const NEXT_STAGE: Record<BlocoKey, ProtocoloStage> = {
  triagem: 'ecg',
  ecg: 'investigacao',
  investigacao: 'desfecho',
  desfecho: 'concluido',
};

export interface ProtocoloMetrics {
  total: number;
  abertos: number;
  concluidos: number;
  porEtapa: Record<ProtocoloStage, number>;
  porVia: { via_i: number; via_ii: number; via_iii: number; naoInformado: number };
  porRiscoHeart: { baixo: number; intermediario: number; alto: number; naoInformado: number };
  indicadores: {
    portaTriagem5: Indicador;
    triagemEcg5: Indicador;
    ecgInterpretacao5: Indicador;
    portaEcg10: Indicador;
    portaAgulha30: Indicador;
    eficaciaTrombolise: Indicador;
    transferenciaMeta: Indicador;
    completude: Indicador;
  };
  tendenciaMensal: { mes: string; total: number }[];
}

@Injectable()
export class ProtocolosService {
  constructor(
    @InjectRepository(ProtocoloEntity)
    private readonly repo: Repository<ProtocoloEntity>,
    private readonly tenantService: TenantService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(
    tenantSlug: string,
    dto: CreateProtocoloDto,
    ctx?: AuditContext,
  ): Promise<ProtocoloEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);

    const base = toSlug(dto.pacienteNome) || 'paciente';
    const dateSuffix = (dto.dataAtendimento ?? '').replace(/-/g, '').slice(0, 8);
    let candidate = `${base}-${dateSuffix || 's'}-${Date.now().toString(36).slice(-4)}`;
    const existing = await this.repo.findOne({ where: { tenantId, slug: candidate } });
    if (existing) candidate = `${candidate}-${Math.floor(Date.now() % 1000)}`;

    const protocolo = this.repo.create({
      tenantId,
      slug: candidate,
      protocolType: 'dor_toracica',
      createdByUserId: ctx?.userId ?? null,
      pacienteNome: dto.pacienteNome,
      numeroProntuario: dto.numeroProntuario ?? '',
      dataNascimento: dto.dataNascimento ?? '',
      idade: dto.idade ?? '',
      sexo: dto.sexo ?? '',
      dataAtendimento: dto.dataAtendimento ?? '',
      horaChegada: dto.horaChegada ?? '',
      currentStage: 'triagem',
    });
    const saved = await this.repo.save(protocolo);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PROTOCOLO_CREATED',
      'protocolo',
      saved.id,
      { pacienteNome: dto.pacienteNome, dataAtendimento: dto.dataAtendimento },
    );

    return saved;
  }

  async findAll(tenantSlug: string, filter?: FilterProtocoloDto): Promise<ProtocoloEntity[]> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p."tenantId" = :tenantId', { tenantId })
      .orderBy('p."createdAt"', 'DESC');

    if (filter?.stage && filter.stage !== 'abertos') {
      qb.andWhere('p."currentStage" = :stage', { stage: filter.stage });
    } else if (filter?.stage === 'abertos') {
      qb.andWhere('p."currentStage" != :concluido', { concluido: 'concluido' });
    }
    return qb.getMany();
  }

  /** Protocolos em aberto (não concluídos) da unidade — tela inicial do operador. */
  async findAbertos(tenantSlug: string): Promise<ProtocoloEntity[]> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    return this.repo.find({
      where: { tenantId, currentStage: Not('concluido' as ProtocoloStage) },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySlug(tenantSlug: string, slug: string): Promise<ProtocoloEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');
    return protocolo;
  }

  /** Salva o rascunho (stand-by) de uma etapa sem fechá-la. */
  async saveRascunho(
    tenantSlug: string,
    slug: string,
    bloco: BlocoKey,
    dados: Record<string, unknown>,
  ): Promise<{ ok: true }> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');
    if (protocolo.currentStage === 'concluido') {
      throw new BadRequestException('Protocolo já concluído');
    }
    const col = `${bloco}Rascunho` as
      | 'triagemRascunho'
      | 'ecgRascunho'
      | 'investigacaoRascunho'
      | 'desfechoRascunho';
    (protocolo as unknown as Record<string, unknown>)[col] = dados;
    await this.repo.save(protocolo);
    return { ok: true };
  }

  /**
   * Fecha um bloco (triagem | ecg | investigacao | desfecho). Valida a ordem
   * sequencial: só é possível fechar o bloco correspondente ao `currentStage`. Ao
   * fechar, avança o estágio. Fechar `desfecho` conclui o protocolo.
   */
  async submitBloco(
    tenantSlug: string,
    slug: string,
    bloco: BlocoKey,
    dto:
      | SubmitBlocoTriagemDto
      | SubmitBlocoEcgDto
      | SubmitBlocoInvestigacaoDto
      | SubmitBlocoDesfechoDto,
    ctx?: AuditContext,
  ): Promise<ProtocoloEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');

    if (protocolo.currentStage === 'concluido') {
      throw new BadRequestException('Protocolo já concluído');
    }
    if (protocolo.currentStage !== bloco) {
      throw new BadRequestException(
        `Etapa fora de ordem. A etapa em aberto é "${protocolo.currentStage}", não "${bloco}".`,
      );
    }

    // Queixa principal: ao menos 1 marcada no fechamento da triagem.
    if (bloco === 'triagem') {
      const q = (dto as SubmitBlocoTriagemDto).queixaPrincipal;
      const algumaQueixa =
        !!q && (q.dorToracica || q.dispneiaSubita || q.sudoreseNauseaSincope || q.dorIrradiada);
      if (!algumaQueixa) {
        throw new BadRequestException(
          'Marque ao menos uma queixa principal antes de fechar a triagem.',
        );
      }
    }

    const fechadoEm = new Date().toISOString();
    const responsavel = {
      responsavelNome: dto.responsavelNome ?? '',
      registroProfissional: dto.registroProfissional ?? '',
      fechadoEm,
    };
    const autor = { userId: ctx?.userId ?? null, nome: responsavel.responsavelNome };

    let action:
      | 'PROTOCOLO_BLOCO_TRIAGEM_SUBMITTED'
      | 'PROTOCOLO_BLOCO_ECG_SUBMITTED'
      | 'PROTOCOLO_BLOCO_INVESTIGACAO_SUBMITTED'
      | 'PROTOCOLO_BLOCO_DESFECHO_SUBMITTED';

    const anterior = protocolo[bloco];

    if (bloco === 'triagem') {
      protocolo.triagem = { ...(dto as SubmitBlocoTriagemDto), ...responsavel } as BlocoTriagem;
      protocolo.triagemRascunho = null;
      action = 'PROTOCOLO_BLOCO_TRIAGEM_SUBMITTED';
    } else if (bloco === 'ecg') {
      protocolo.ecg = { ...(dto as SubmitBlocoEcgDto), ...responsavel } as BlocoEcg;
      protocolo.ecgRascunho = null;
      action = 'PROTOCOLO_BLOCO_ECG_SUBMITTED';
    } else if (bloco === 'investigacao') {
      protocolo.investigacao = {
        ...(dto as SubmitBlocoInvestigacaoDto),
        ...responsavel,
      } as BlocoInvestigacao;
      protocolo.investigacaoRascunho = null;
      action = 'PROTOCOLO_BLOCO_INVESTIGACAO_SUBMITTED';
    } else {
      protocolo.desfecho = { ...(dto as SubmitBlocoDesfechoDto), ...responsavel } as BlocoDesfecho;
      protocolo.desfechoRascunho = null;
      action = 'PROTOCOLO_BLOCO_DESFECHO_SUBMITTED';
    }

    protocolo.currentStage = NEXT_STAGE[bloco];

    // Histórico campo-a-campo (só campos que mudaram).
    const novas = diffCampos(bloco, anterior, protocolo[bloco], autor, fechadoEm);
    if (novas.length > 0) {
      protocolo.historicoAlteracoes = [...(protocolo.historicoAlteracoes ?? []), ...novas];
    }
    // Histórico por ação — fechamento da etapa (sempre registrado).
    protocolo.historicoAcoes = [
      ...(protocolo.historicoAcoes ?? []),
      {
        tipo: 'fechamento',
        bloco,
        porNome: responsavel.responsavelNome,
        porRegistro: responsavel.registroProfissional,
        porUserId: ctx?.userId ?? null,
        em: fechadoEm,
        campos: novas.map((c) => ({ campo: c.campo, de: c.de, para: c.para })),
      },
    ];

    const saved = await this.repo.save(protocolo);

    await this.auditLog.record(ctx ?? { tenantId }, action, 'protocolo', saved.id, {
      responsavelNome: responsavel.responsavelNome,
      registroProfissional: responsavel.registroProfissional,
      camposAlterados: novas.length,
    });

    return saved;
  }

  /**
   * Edita uma etapa JÁ FECHADA (sem alterar o currentStage). Registra a alteração
   * campo-a-campo e uma ação de tipo 'edicao' no histórico, com autor/registro/hora.
   * Permitido a operador e médico.
   */
  async editarBloco(
    tenantSlug: string,
    slug: string,
    bloco: BlocoKey,
    dto:
      | SubmitBlocoTriagemDto
      | SubmitBlocoEcgDto
      | SubmitBlocoInvestigacaoDto
      | SubmitBlocoDesfechoDto,
    ctx?: AuditContext,
  ): Promise<ProtocoloEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');

    const anterior = protocolo[bloco];
    if (!anterior) {
      throw new BadRequestException('Esta etapa ainda não foi preenchida.');
    }

    // Queixa principal continua obrigatória (≥1) ao editar a triagem.
    if (bloco === 'triagem') {
      const q = (dto as SubmitBlocoTriagemDto).queixaPrincipal;
      const algumaQueixa =
        !!q && (q.dorToracica || q.dispneiaSubita || q.sudoreseNauseaSincope || q.dorIrradiada);
      if (!algumaQueixa) {
        throw new BadRequestException('Marque ao menos uma queixa principal.');
      }
    }

    const em = new Date().toISOString();
    // Preserva o responsável/fechamento original; a edição é creditada à parte.
    const orig = anterior as unknown as {
      responsavelNome: string;
      registroProfissional: string;
      fechadoEm: string;
    };
    // Merge profundo (1 nível) sobre o estado anterior: evita apagar campos que o
    // cliente não enviou. Objetos aninhados (sinaisVitais, diagnosticos, etc.) são mesclados.
    const atualizado = mergeBloco(anterior, dto as unknown as Record<string, unknown>);
    atualizado.responsavelNome = orig.responsavelNome;
    atualizado.registroProfissional = orig.registroProfissional;
    atualizado.fechadoEm = orig.fechadoEm;

    const autorNome = dto.responsavelNome ?? '';
    const novas = diffCampos(bloco, anterior, atualizado, { userId: ctx?.userId ?? null, nome: autorNome }, em);
    if (novas.length === 0) {
      // Nada mudou — não registra ação nem salva.
      return protocolo;
    }

    (protocolo as unknown as Record<string, unknown>)[bloco] = atualizado;
    protocolo.historicoAlteracoes = [...(protocolo.historicoAlteracoes ?? []), ...novas];
    protocolo.historicoAcoes = [
      ...(protocolo.historicoAcoes ?? []),
      {
        tipo: 'edicao',
        bloco,
        porNome: autorNome,
        porRegistro: dto.registroProfissional ?? '',
        porUserId: ctx?.userId ?? null,
        em,
        campos: novas.map((c) => ({ campo: c.campo, de: c.de, para: c.para })),
      },
    ];

    const saved = await this.repo.save(protocolo);

    await this.auditLog.record(ctx ?? { tenantId }, 'PROTOCOLO_BLOCO_EDITADO', 'protocolo', saved.id, {
      bloco,
      responsavelNome: autorNome,
      registroProfissional: dto.registroProfissional ?? '',
      camposAlterados: novas.length,
    });

    return saved;
  }

  /**
   * Encerramento antecipado do protocolo pelo médico, em qualquer etapa, por
   * não-continuidade ou não-indicação. Conclui o protocolo sem percorrer as etapas.
   */
  async encerrar(
    tenantSlug: string,
    slug: string,
    dto: EncerrarProtocoloDto,
    ctx?: AuditContext,
  ): Promise<ProtocoloEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');
    if (protocolo.currentStage === 'concluido') {
      throw new BadRequestException('Protocolo já concluído');
    }

    const encerradoEm = new Date().toISOString();
    const encerramento: EncerramentoProtocolo = {
      motivo: dto.motivo,
      observacao: dto.observacao,
      etapaNoEncerramento: protocolo.currentStage,
      encerradoPorNome: dto.responsavelNome ?? '',
      encerradoPorRegistro: dto.registroProfissional ?? '',
      encerradoPorUserId: ctx?.userId ?? null,
      encerradoEm,
    };
    protocolo.encerramento = encerramento;
    protocolo.currentStage = 'concluido';

    const saved = await this.repo.save(protocolo);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PROTOCOLO_ENCERRADO',
      'protocolo',
      saved.id,
      {
        motivo: dto.motivo,
        etapaNoEncerramento: encerramento.etapaNoEncerramento,
        responsavelNome: encerramento.encerradoPorNome,
      },
    );

    return saved;
  }

  async remove(tenantSlug: string, slug: string, ctx?: AuditContext): Promise<{ deleted: number }> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');
    await this.repo.softRemove(protocolo);

    await this.auditLog.record(ctx ?? { tenantId }, 'PROTOCOLO_DELETED', 'protocolo', protocolo.id, {
      pacienteNome: protocolo.pacienteNome,
    });

    return { deleted: 1 };
  }

  /** Indicadores do FORMMED026 — calculados a partir dos marcos de tempo registrados. */
  async getMetrics(tenantId: string, filter?: FilterProtocoloDto): Promise<ProtocoloMetrics> {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p."tenantId" = :tenantId', { tenantId });
    if (filter?.startDate) {
      qb.andWhere('p."dataAtendimento" >= :start', { start: filter.startDate });
    }
    if (filter?.endDate) {
      qb.andWhere('p."dataAtendimento" <= :end', { end: filter.endDate });
    }
    const protocolos = await qb.getMany();

    const porEtapa: Record<ProtocoloStage, number> = {
      triagem: 0,
      ecg: 0,
      investigacao: 0,
      desfecho: 0,
      concluido: 0,
    };
    const porVia = { via_i: 0, via_ii: 0, via_iii: 0, naoInformado: 0 };
    const porRiscoHeart = { baixo: 0, intermediario: 0, alto: 0, naoInformado: 0 };

    // contadores dos indicadores
    let pt5n = 0, pt5d = 0;
    let te5n = 0, te5d = 0;
    let ei5n = 0, ei5d = 0;
    let pe10n = 0, pe10d = 0;
    let pa30n = 0, pa30d = 0;
    let efN = 0, efD = 0;
    let trN = 0, trD = 0;
    let compN = 0, compD = 0;

    const mesMap = new Map<string, number>();

    for (const p of protocolos) {
      porEtapa[p.currentStage]++;

      const tri = p.triagem;
      const ecg = p.ecg;
      const inv = p.investigacao;
      const des = p.desfecho;

      // distribuição por VIA (ECG)
      const via = ecg?.resultadoEcg;
      if (via === 'via_i') porVia.via_i++;
      else if (via === 'via_ii') porVia.via_ii++;
      else if (via === 'via_iii') porVia.via_iii++;
      else porVia.naoInformado++;

      // distribuição por risco HEART
      const risco = inv?.heartFaixaRisco;
      if (risco === 'baixo') porRiscoHeart.baixo++;
      else if (risco === 'intermediario') porRiscoHeart.intermediario++;
      else if (risco === 'alto') porRiscoHeart.alto++;
      else porRiscoHeart.naoInformado++;

      // tendência mensal (por dataAtendimento)
      const mes = (p.dataAtendimento || '').slice(0, 7);
      if (mes) mesMap.set(mes, (mesMap.get(mes) ?? 0) + 1);

      // 1. Porta-Triagem ≤ 5 min (chegada → início triagem)
      const dPortaTriagem = deltaMin(p.horaChegada, tri?.inicioTriagem);
      if (dPortaTriagem !== null) {
        pt5d++;
        if (dPortaTriagem <= 5) pt5n++;
      }

      // 2. Triagem → ECG ≤ 5 min
      const dTriagemEcg = deltaMin(tri?.inicioTriagem, ecg?.primeiroEcgHora);
      if (dTriagemEcg !== null) {
        te5d++;
        if (dTriagemEcg <= 5) te5n++;
      }

      // 3. ECG → Interpretação ≤ 5 min
      const dEcgInterp = deltaMin(ecg?.primeiroEcgHora, ecg?.interpretacaoMedicaHora);
      if (dEcgInterp !== null) {
        ei5d++;
        if (dEcgInterp <= 5) ei5n++;
      }

      // 4. Porta-ECG total ≤ 10 min (chegada → interpretação)
      const dPortaEcg = deltaMin(p.horaChegada, ecg?.interpretacaoMedicaHora);
      const portaEcgOk = dPortaEcg !== null && dPortaEcg <= 10;
      if (dPortaEcg !== null) {
        pe10d++;
        if (portaEcgOk) pe10n++;
      }

      // 5. Porta-Agulha ≤ 30 min (início triagem → fibrinolítico) — só elegíveis trombolisados
      if (des?.trombolitiseElegivel && des?.inicioFibrinolitico) {
        const dAgulha = deltaMin(tri?.inicioTriagem, des.inicioFibrinolitico);
        if (dAgulha !== null) {
          pa30d++;
          if (dAgulha <= 30) pa30n++;
        }
      }

      // 6. Eficácia da trombólise (≥ 2 critérios de reperfusão) — sobre trombolisados
      if (des?.trombolitiseElegivel && des?.inicioFibrinolitico) {
        efD++;
        const cr = des.criteriosReperfusao;
        const nCrit =
          (cr?.resolucaoSt50 ? 1 : 0) + (cr?.eva3 ? 1 : 0) + (cr?.arritmiaReperfusao ? 1 : 0);
        if (nCrit >= 2) efN++;
      }

      // 7. Transferência dentro da meta (proxy ≤ 6h do início do atendimento)
      const ehTransferencia =
        des?.destino === 'transferencia_icp' || des?.destino === 'transferencia_uti_referencia';
      if (ehTransferencia && des?.saidaEfetivaHora) {
        const dTransf = deltaMin(tri?.inicioTriagem || p.horaChegada, des.saidaEfetivaHora);
        if (dTransf !== null) {
          trD++;
          if (dTransf <= 360) trN++;
        }
      }

      // 8. Completude do protocolo (6 critérios) — sobre concluídos
      if (p.currentStage === 'concluido') {
        compD++;
        const c1 = portaEcgOk; // ECG ≤ 10 min
        const c2 = !!inv; // avaliação médica + Dx diferenciais (bloco investigação preenchido)
        const c3 = (inv?.heartTotal ?? 0) > 0 || !!inv?.heartFaixaRisco; // HEART aplicado
        const c4 = !!inv?.coleta0h?.resultado; // troponina com algoritmo (coleta 0h)
        const c5 = !!inv?.heartFaixaRisco; // classificação de risco final
        const c6 = !!des?.destino; // desfecho documentado
        if (c1 && c2 && c3 && c4 && c5 && c6) compN++;
      }
    }

    const tendenciaMensal = Array.from(mesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, total]) => ({ mes, total }));

    return {
      total: protocolos.length,
      abertos: protocolos.length - porEtapa.concluido,
      concluidos: porEtapa.concluido,
      porEtapa,
      porVia,
      porRiscoHeart,
      indicadores: {
        portaTriagem5: indicador(pt5n, pt5d, 90),
        triagemEcg5: indicador(te5n, te5d, 90),
        ecgInterpretacao5: indicador(ei5n, ei5d, 90),
        portaEcg10: indicador(pe10n, pe10d, 90),
        portaAgulha30: indicador(pa30n, pa30d, 90),
        eficaciaTrombolise: indicador(efN, efD, 70),
        transferenciaMeta: indicador(trN, trD, 90),
        completude: indicador(compN, compD, 90),
      },
      tendenciaMensal,
    };
  }
}
