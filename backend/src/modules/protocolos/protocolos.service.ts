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
  BlocoTriagem,
  BlocoInvestigacao,
  BlocoDesfecho,
} from './entities/protocolo.entity';
import { TenantService } from '../tenants/tenant.service';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { SubmitBlocoTriagemDto } from './dto/submit-bloco-triagem.dto';
import { SubmitBlocoInvestigacaoDto } from './dto/submit-bloco-investigacao.dto';
import { SubmitBlocoDesfechoDto } from './dto/submit-bloco-desfecho.dto';
import { FilterProtocoloDto } from './dto/filter-protocolo.dto';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** "HH:mm" → minutos desde a meia-noite, ou null se inválido. */
function hhmmToMinutes(value?: string): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Diferença em minutos entre dois horários "HH:mm" no mesmo dia (cruza meia-noite se end < start). */
function deltaMin(startHHmm?: string, endHHmm?: string): number | null {
  const s = hhmmToMinutes(startHHmm);
  const e = hhmmToMinutes(endHHmm);
  if (s === null || e === null) return null;
  let d = e - s;
  if (d < 0) d += 24 * 60; // virada de dia
  return d;
}

interface Indicador {
  numerador: number;
  denominador: number;
  percentual: number;
  meta: number;
}

function indicador(numerador: number, denominador: number, meta: number): Indicador {
  return {
    numerador,
    denominador,
    percentual: denominador > 0 ? Math.round((numerador / denominador) * 1000) / 10 : 0,
    meta,
  };
}

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

  /**
   * Fecha um bloco (triagem | investigacao | desfecho). Valida a ordem sequencial:
   * só é possível fechar o bloco correspondente ao `currentStage`. Ao fechar, avança
   * o estágio. Fechar `desfecho` conclui o protocolo.
   */
  async submitBloco(
    tenantSlug: string,
    slug: string,
    bloco: 'triagem' | 'investigacao' | 'desfecho',
    dto: SubmitBlocoTriagemDto | SubmitBlocoInvestigacaoDto | SubmitBlocoDesfechoDto,
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

    const fechadoEm = new Date().toISOString();
    const responsavel = {
      responsavelNome: dto.responsavelNome,
      registroProfissional: dto.registroProfissional,
      fechadoEm,
    };

    let action:
      | 'PROTOCOLO_BLOCO_TRIAGEM_SUBMITTED'
      | 'PROTOCOLO_BLOCO_INVESTIGACAO_SUBMITTED'
      | 'PROTOCOLO_BLOCO_DESFECHO_SUBMITTED';

    if (bloco === 'triagem') {
      protocolo.triagem = { ...(dto as SubmitBlocoTriagemDto), ...responsavel } as BlocoTriagem;
      protocolo.currentStage = 'investigacao';
      action = 'PROTOCOLO_BLOCO_TRIAGEM_SUBMITTED';
    } else if (bloco === 'investigacao') {
      protocolo.investigacao = {
        ...(dto as SubmitBlocoInvestigacaoDto),
        ...responsavel,
      } as BlocoInvestigacao;
      protocolo.currentStage = 'desfecho';
      action = 'PROTOCOLO_BLOCO_INVESTIGACAO_SUBMITTED';
    } else {
      protocolo.desfecho = { ...(dto as SubmitBlocoDesfechoDto), ...responsavel } as BlocoDesfecho;
      protocolo.currentStage = 'concluido';
      action = 'PROTOCOLO_BLOCO_DESFECHO_SUBMITTED';
    }

    const saved = await this.repo.save(protocolo);

    await this.auditLog.record(ctx ?? { tenantId }, action, 'protocolo', saved.id, {
      responsavelNome: dto.responsavelNome,
      registroProfissional: dto.registroProfissional,
    });

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
      const inv = p.investigacao;
      const des = p.desfecho;

      // distribuição por VIA (ECG)
      const via = tri?.resultadoEcg;
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
      const dTriagemEcg = deltaMin(tri?.inicioTriagem, tri?.primeiroEcgHora);
      if (dTriagemEcg !== null) {
        te5d++;
        if (dTriagemEcg <= 5) te5n++;
      }

      // 3. ECG → Interpretação ≤ 5 min
      const dEcgInterp = deltaMin(tri?.primeiroEcgHora, tri?.interpretacaoMedicaHora);
      if (dEcgInterp !== null) {
        ei5d++;
        if (dEcgInterp <= 5) ei5n++;
      }

      // 4. Porta-ECG total ≤ 10 min (chegada → interpretação)
      const dPortaEcg = deltaMin(p.horaChegada, tri?.interpretacaoMedicaHora);
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
