import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PesquisaCorporativaEntity, PesquisaBloco } from './entities/pesquisa-corporativa.entity';
import { TenantService } from '../tenants/tenant.service';
import { CreatePesquisaDto } from './dto/create-pesquisa.dto';
import { UpdatePesquisaDto } from './dto/update-pesquisa.dto';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class PesquisasCorporativasService {
  constructor(
    @InjectRepository(PesquisaCorporativaEntity)
    private readonly repo: Repository<PesquisaCorporativaEntity>,
    private readonly tenantService: TenantService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(
    tenantSlug: string | null,
    dto: CreatePesquisaDto,
    ctx?: AuditContext,
  ): Promise<PesquisaCorporativaEntity> {
    const tenantId = tenantSlug ? await this.tenantService.resolveId(tenantSlug) : null;

    if (!dto.blocos || dto.blocos.length === 0) {
      throw new BadRequestException('A pesquisa deve ter ao menos um bloco');
    }

    const base = toSlug(dto.titulo);
    const suffix = Date.now().toString(36).slice(-4);
    let slug = base;
    const existing = await this.repo.findOne({
      where: { tenantId: tenantId ?? IsNull(), slug },
    });
    if (existing) slug = `${base}-${suffix}`;

    const pesquisa = this.repo.create({
      tenantId: tenantId as string,
      titulo: dto.titulo,
      slug,
      tipo: dto.tipo,
      blocos: dto.blocos as unknown as PesquisaBloco[],
      ativa: dto.ativa ?? true,
      periodo: dto.periodo ?? null,
    });

    const saved = await this.repo.save(pesquisa);

    if (ctx) {
      await this.auditLog.record(ctx, 'TRAINING_SESSION_CREATED', 'pesquisa_corporativa', saved.id, {
        titulo: dto.titulo,
        tipo: dto.tipo,
      });
    }

    return saved;
  }

  async findAll(tenantSlug: string): Promise<PesquisaCorporativaEntity[]> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    return this.repo.find({
      where: [{ tenantId }, { tenantId: IsNull() }],
      order: { criadoEm: 'DESC' },
    });
  }

  async findBySlug(tenantSlug: string | null, slug: string): Promise<PesquisaCorporativaEntity> {
    const tenantId = tenantSlug ? await this.tenantService.resolveId(tenantSlug) : null;

    const pesquisa = await this.repo.findOne({
      where: tenantId
        ? [{ tenantId, slug }, { tenantId: IsNull(), slug }]
        : [{ tenantId: IsNull(), slug }],
    });

    if (!pesquisa) throw new NotFoundException('Pesquisa não encontrada');
    return pesquisa;
  }

  async update(
    tenantSlug: string,
    slug: string,
    dto: UpdatePesquisaDto,
    ctx?: AuditContext,
  ): Promise<PesquisaCorporativaEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pesquisa = await this.repo.findOne({ where: [{ tenantId, slug }, { tenantId: IsNull(), slug }] });
    if (!pesquisa) throw new NotFoundException('Pesquisa não encontrada');

    Object.assign(pesquisa, dto);
    const saved = await this.repo.save(pesquisa);

    if (ctx) {
      await this.auditLog.record(ctx, 'TRAINING_SESSION_UPDATED', 'pesquisa_corporativa', pesquisa.id, {
        changes: dto,
      });
    }

    return saved;
  }

  async remove(tenantSlug: string, slug: string, ctx?: AuditContext): Promise<{ deleted: number }> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pesquisa = await this.repo.findOne({ where: { tenantId, slug } });
    if (!pesquisa) throw new NotFoundException('Pesquisa não encontrada');

    await this.repo.remove(pesquisa);

    if (ctx) {
      await this.auditLog.record(ctx, 'TRAINING_SESSION_DELETED', 'pesquisa_corporativa', pesquisa.id, {
        titulo: pesquisa.titulo,
      });
    }

    return { deleted: 1 };
  }
}
