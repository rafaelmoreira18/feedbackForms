import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingSessionEntity } from './training-session.entity';
import { TenantService } from '../tenants/tenant.service';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { UpdateTrainingSessionDto } from './dto/update-training-session.dto';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class TrainingSessionsService {
  constructor(
    @InjectRepository(TrainingSessionEntity)
    private readonly repo: Repository<TrainingSessionEntity>,
    private readonly tenantService: TenantService,
  ) {}

  private async resolveTenantId(slug: string): Promise<string> {
    const tenant = await this.tenantService.findBySlug(slug);
    return tenant.id;
  }

  async create(tenantSlug: string, dto: CreateTrainingSessionDto): Promise<TrainingSessionEntity> {
    const tenantId = await this.resolveTenantId(tenantSlug);

    // Build a unique slug: title-based + date suffix
    const base = toSlug(dto.title);
    const dateSuffix = dto.trainingDate.replace(/-/g, '').slice(0, 8);
    let candidate = `${base}-${dateSuffix}`;
    const existing = await this.repo.findOne({ where: { tenantId, slug: candidate } });
    if (existing) {
      candidate = `${candidate}-${Date.now().toString(36)}`;
    }

    const session = this.repo.create({ ...dto, tenantId, slug: candidate });
    return this.repo.save(session);
  }

  async findAll(tenantSlug: string): Promise<TrainingSessionEntity[]> {
    const tenantId = await this.resolveTenantId(tenantSlug);
    return this.repo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findBySlug(tenantSlug: string, sessionSlug: string): Promise<TrainingSessionEntity> {
    const tenantId = await this.resolveTenantId(tenantSlug);
    const session = await this.repo.findOne({ where: { tenantId, slug: sessionSlug } });
    if (!session) throw new NotFoundException('Treinamento não encontrado');
    return session;
  }

  async update(
    tenantSlug: string,
    sessionSlug: string,
    dto: UpdateTrainingSessionDto,
  ): Promise<TrainingSessionEntity> {
    const tenantId = await this.resolveTenantId(tenantSlug);
    const session = await this.repo.findOne({ where: { tenantId, slug: sessionSlug } });
    if (!session) throw new NotFoundException('Treinamento não encontrado');

    // If title changes, rebuild slug only if explicitly sent with new title
    if (dto.title && dto.title !== session.title) {
      const base = toSlug(dto.title);
      const dateSuffix = (dto.trainingDate ?? session.trainingDate).replace(/-/g, '').slice(0, 8);
      let newSlug = `${base}-${dateSuffix}`;
      const conflict = await this.repo.findOne({ where: { tenantId, slug: newSlug } });
      if (conflict && conflict.id !== session.id) {
        newSlug = `${newSlug}-${Date.now().toString(36)}`;
      }
      Object.assign(session, dto, { slug: newSlug });
    } else {
      Object.assign(session, dto);
    }

    return this.repo.save(session);
  }

  async remove(tenantSlug: string, sessionSlug: string): Promise<{ deleted: number }> {
    const tenantId = await this.resolveTenantId(tenantSlug);
    const session = await this.repo.findOne({ where: { tenantId, slug: sessionSlug } });
    if (!session) throw new NotFoundException('Treinamento não encontrado');
    await this.repo.remove(session);
    return { deleted: 1 };
  }

  /**
   * Creates a linked eficácia session derived from the given reação session.
   * - Copies title, instructor, tenantId from reação
   * - Sets trainingDate = reação.trainingDate + 30 days
   * - Sets linkedSessionId = reação.id
   * - Throws ConflictException if an eficácia already exists for this reação
   */
  async createEficacia(tenantSlug: string, reacaoSlug: string): Promise<TrainingSessionEntity> {
    const tenantId = await this.resolveTenantId(tenantSlug);

    const reacao = await this.repo.findOne({ where: { tenantId, slug: reacaoSlug } });
    if (!reacao) throw new NotFoundException('Sessão de reação não encontrada');
    if (reacao.trainingType !== 'reacao') {
      throw new BadRequestException('A sessão informada não é do tipo reação');
    }

    const alreadyLinked = await this.repo.findOne({ where: { tenantId, linkedSessionId: reacao.id } });
    if (alreadyLinked) {
      throw new ConflictException('Já existe uma avaliação de eficácia vinculada a este treinamento');
    }

    // Compute eficácia date: reação date + 30 days (UTC-safe arithmetic)
    const [ry, rm, rd] = reacao.trainingDate.split('-').map(Number);
    const eficaciaDateObj = new Date(Date.UTC(ry, rm - 1, rd + 30));
    const eficaciaDate = eficaciaDateObj.toISOString().slice(0, 10);

    // Build unique slug: title-eficacia-YYYYMMDD
    const base = toSlug(reacao.title);
    const dateSuffix = eficaciaDate.replace(/-/g, '');
    let candidate = `${base}-eficacia-${dateSuffix}`;
    const conflict = await this.repo.findOne({ where: { tenantId, slug: candidate } });
    if (conflict) {
      candidate = `${candidate}-${Date.now().toString(36)}`;
    }

    const session = this.repo.create({
      tenantId,
      slug: candidate,
      title: reacao.title,
      instructor: reacao.instructor,
      trainingDate: eficaciaDate,
      trainingType: 'eficacia',
      linkedSessionId: reacao.id,
      active: true,
    });

    return this.repo.save(session);
  }
}
