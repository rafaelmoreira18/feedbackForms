import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
  ) {}

  async create(dto: CreateTenantDto): Promise<TenantEntity> {
    const existing = await this.tenantRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Tenant slug already exists');
    }
    const tenant = this.tenantRepo.create({
      ...dto,
      logoUrl: dto.logoUrl ?? null,
    });
    return this.tenantRepo.save(tenant);
  }

  async findAll(): Promise<TenantEntity[]> {
    return this.tenantRepo.find({ where: { active: true, hasFeedbackForms: true } });
  }

  /** Returns tenants that appear in /treinamentos: hasFeedbackForms=true + sede Mediall. */
  async findAllForTraining(): Promise<TenantEntity[]> {
    return this.tenantRepo
      .createQueryBuilder('t')
      .where('t.active = true')
      .andWhere('(t."hasFeedbackForms" = true OR t.slug = :sede)', { sede: 'mediall-goiania' })
      .orderBy('t.name', 'ASC')
      .getMany();
  }

  async findBySlug(slug: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepo.findOne({ where: { slug, active: true } });
    if (!tenant) throw new NotFoundException(`Tenant '${slug}' not found`);
    return tenant;
  }

  async findById(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }
}
