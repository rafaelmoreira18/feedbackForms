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
  EncerramentoProtocolo,
} from './entities/protocolo.entity';
import { TenantService } from '../tenants/tenant.service';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';
import { CreateProtocoloDto } from './dto/create-protocolo.dto';
import { EncerrarProtocoloDto } from './dto/encerrar-protocolo.dto';
import { FilterProtocoloDto } from './dto/filter-protocolo.dto';
import { toSlug } from './utils/slug-time.util';
import { mergeBloco, diffCampos } from './utils/bloco-diff.util';
import { blocoOf, hydrateProtocolo } from './utils/bloco-access.util';
import {
  getDefinition,
  firstStage,
  isValidStage,
} from './protocolo-definitions';
import type { ProtocoloMetrics } from './metrics/metrics.types';

/** Payload genérico de um bloco — campos do form + responsável (capturado do usuário logado). */
type BlocoPayload = Record<string, unknown> & {
  responsavelNome?: string;
  registroProfissional?: string;
};

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
    const protocolType = dto.protocolType ?? 'dor_toracica';
    const def = getDefinition(protocolType);

    const base = toSlug(dto.pacienteNome) || 'paciente';
    const dateSuffix = (dto.dataAtendimento ?? '').replace(/-/g, '').slice(0, 8);
    let candidate = `${base}-${dateSuffix || 's'}-${Date.now().toString(36).slice(-4)}`;
    const existing = await this.repo.findOne({ where: { tenantId, slug: candidate } });
    if (existing) candidate = `${candidate}-${Math.floor(Date.now() % 1000)}`;

    const protocolo = this.repo.create({
      tenantId,
      slug: candidate,
      protocolType,
      createdByUserId: ctx?.userId ?? null,
      pacienteNome: dto.pacienteNome,
      numeroProntuario: dto.numeroProntuario ?? '',
      dataNascimento: dto.dataNascimento ?? '',
      idade: dto.idade ?? '',
      sexo: dto.sexo ?? '',
      pesoKg: dto.pesoKg ?? '',
      variante: dto.variante ?? '',
      dataAtendimento: dto.dataAtendimento ?? '',
      horaChegada: dto.horaChegada ?? '',
      currentStage: firstStage(def),
      blocos: {},
      rascunhos: {},
    });
    const saved = await this.repo.save(protocolo);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'PROTOCOLO_CREATED',
      'protocolo',
      saved.id,
      { protocolType, pacienteNome: dto.pacienteNome, dataAtendimento: dto.dataAtendimento },
    );

    return hydrateProtocolo(saved);
  }

  async findAll(tenantSlug: string, filter?: FilterProtocoloDto): Promise<ProtocoloEntity[]> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p."tenantId" = :tenantId', { tenantId })
      .orderBy('p."createdAt"', 'DESC');

    if (filter?.protocolType) {
      qb.andWhere('p."protocolType" = :pt', { pt: filter.protocolType });
    }
    if (filter?.stage && filter.stage !== 'abertos') {
      qb.andWhere('p."currentStage" = :stage', { stage: filter.stage });
    } else if (filter?.stage === 'abertos') {
      qb.andWhere('p."currentStage" != :concluido', { concluido: 'concluido' });
    }
    const rows = await qb.getMany();
    return rows.map(hydrateProtocolo);
  }

  /** Protocolos em aberto (não concluídos) da unidade — tela inicial do operador. */
  async findAbertos(tenantSlug: string, protocolType?: string): Promise<ProtocoloEntity[]> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const rows = await this.repo.find({
      where: {
        tenantId,
        currentStage: Not('concluido' as ProtocoloStage),
        ...(protocolType ? { protocolType } : {}),
      },
      order: { createdAt: 'DESC' },
    });
    return rows.map(hydrateProtocolo);
  }

  async findBySlug(tenantSlug: string, slug: string): Promise<ProtocoloEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');
    return hydrateProtocolo(protocolo);
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
    const def = getDefinition(protocolo.protocolType);
    if (!isValidStage(def, bloco)) {
      throw new BadRequestException(`Etapa "${bloco}" inválida para ${def.label}.`);
    }
    protocolo.rascunhos = { ...(protocolo.rascunhos ?? {}), [bloco]: dados };
    await this.repo.save(protocolo);
    return { ok: true };
  }

  /**
   * Fecha um bloco (etapa). Etapas são livres: qualquer etapa ainda não fechada pode ser
   * fechada em qualquer ordem (validado pela definição do tipo). O `currentStage` passa a
   * apontar para a primeira etapa ainda aberta; conclui quando todas estiverem fechadas.
   */
  async submitBloco(
    tenantSlug: string,
    slug: string,
    bloco: BlocoKey,
    dto: BlocoPayload,
    ctx?: AuditContext,
  ): Promise<ProtocoloEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');

    if (protocolo.currentStage === 'concluido') {
      throw new BadRequestException('Protocolo já concluído');
    }
    const def = getDefinition(protocolo.protocolType);
    if (!isValidStage(def, bloco)) {
      throw new BadRequestException(`Etapa "${bloco}" inválida para ${def.label}.`);
    }
    // Etapas livres: qualquer etapa ainda não fechada pode ser fechada, em qualquer ordem,
    // desde que seus campos obrigatórios estejam preenchidos (validados aqui/no frontend).

    // Validação específica do tipo de protocolo (ex.: queixa principal na triagem da Dor Torácica).
    def.validateBloco?.(bloco, dto, { variante: protocolo.variante });

    const fechadoEm = new Date().toISOString();
    const responsavel = {
      responsavelNome: dto.responsavelNome ?? '',
      registroProfissional: dto.registroProfissional ?? '',
      fechadoEm,
    };
    const autor = { userId: ctx?.userId ?? null, nome: responsavel.responsavelNome };

    const anterior = blocoOf(protocolo, bloco);
    const novoBloco = { ...dto, ...responsavel };

    protocolo.blocos = { ...(protocolo.blocos ?? {}), [bloco]: novoBloco };
    const rascunhos = { ...(protocolo.rascunhos ?? {}) };
    delete rascunhos[bloco];
    protocolo.rascunhos = rascunhos;
    // currentStage = primeira etapa ainda não fechada (na ordem da definição);
    // concluído quando TODAS as etapas estiverem fechadas (etapas livres, fora de ordem).
    protocolo.currentStage =
      def.stages.find((s) => protocolo.blocos[s.key] == null)?.key ?? 'concluido';

    // Histórico campo-a-campo (só campos que mudaram).
    const novas = diffCampos(bloco, anterior, novoBloco, autor, fechadoEm);
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

    await this.auditLog.record(ctx ?? { tenantId }, 'PROTOCOLO_BLOCO_SUBMITTED', 'protocolo', saved.id, {
      bloco,
      protocolType: protocolo.protocolType,
      responsavelNome: responsavel.responsavelNome,
      registroProfissional: responsavel.registroProfissional,
      camposAlterados: novas.length,
    });

    return hydrateProtocolo(saved);
  }

  /**
   * Edita uma etapa JÁ FECHADA (sem alterar o currentStage). Registra a alteração
   * campo-a-campo e uma ação de tipo 'edicao' no histórico, com autor/registro/hora.
   */
  async editarBloco(
    tenantSlug: string,
    slug: string,
    bloco: BlocoKey,
    dto: BlocoPayload,
    ctx?: AuditContext,
  ): Promise<ProtocoloEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const protocolo = await this.repo.findOne({ where: { tenantId, slug } });
    if (!protocolo) throw new NotFoundException('Protocolo não encontrado');

    const def = getDefinition(protocolo.protocolType);
    if (!isValidStage(def, bloco)) {
      throw new BadRequestException(`Etapa "${bloco}" inválida para ${def.label}.`);
    }

    const anterior = blocoOf(protocolo, bloco);
    if (!anterior) {
      throw new BadRequestException('Esta etapa ainda não foi preenchida.');
    }

    // Validação específica do tipo (ex.: queixa principal ≥1 ao editar a triagem).
    def.validateBloco?.(bloco, dto, { variante: protocolo.variante });

    const em = new Date().toISOString();
    // Preserva o responsável/fechamento original; a edição é creditada à parte.
    const orig = anterior as {
      responsavelNome: string;
      registroProfissional: string;
      fechadoEm: string;
    };
    // Merge profundo (1 nível) sobre o estado anterior: evita apagar campos não enviados.
    const atualizado = mergeBloco(anterior, dto);
    atualizado.responsavelNome = orig.responsavelNome;
    atualizado.registroProfissional = orig.registroProfissional;
    atualizado.fechadoEm = orig.fechadoEm;

    const autorNome = dto.responsavelNome ?? '';
    const novas = diffCampos(bloco, anterior, atualizado, { userId: ctx?.userId ?? null, nome: autorNome }, em);
    if (novas.length === 0) {
      // Nada mudou — não registra ação nem salva.
      return hydrateProtocolo(protocolo);
    }

    protocolo.blocos = { ...(protocolo.blocos ?? {}), [bloco]: atualizado };
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
      protocolType: protocolo.protocolType,
      responsavelNome: autorNome,
      registroProfissional: dto.registroProfissional ?? '',
      camposAlterados: novas.length,
    });

    return hydrateProtocolo(saved);
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

    return hydrateProtocolo(saved);
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

  /** Indicadores do dashboard — estratégia por tipo de protocolo (FORMMED026 / bundle Sepse). */
  async getMetrics(tenantId: string, filter?: FilterProtocoloDto): Promise<ProtocoloMetrics> {
    const protocolType = filter?.protocolType ?? 'dor_toracica';
    const def = getDefinition(protocolType);

    const qb = this.repo
      .createQueryBuilder('p')
      .where('p."tenantId" = :tenantId', { tenantId })
      .andWhere('p."protocolType" = :pt', { pt: protocolType });
    if (filter?.startDate) {
      qb.andWhere('p."dataAtendimento" >= :start', { start: filter.startDate });
    }
    if (filter?.endDate) {
      qb.andWhere('p."dataAtendimento" <= :end', { end: filter.endDate });
    }
    const protocolos = await qb.getMany();

    return def.metrics(protocolos);
  }
}
