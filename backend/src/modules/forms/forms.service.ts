import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Form3ResponseEntity, Form3Response } from './forms.entity';
import { FormTemplateEntity } from '../form-templates/form-template.entity';
import { CreateForm3Dto } from './dto/create-form.dto';
import { FilterForm3Dto } from './dto/filter-form.dto';
import { UpdateCpfDto } from './dto/update-cpf.dto';
import { AuditLogService, AuditContext } from '../audit-log/audit-log.service';

function maskCpf(cpf: string | null): string | null {
  if (!cpf) return cpf;
  return cpf.replace(/^(\d{3})\d{3}\d{3}(\d{2})$/, '$1.***.***-$2');
}

// Returns plain SQL strings so pg never touches a JS Date and no timezone
// conversion can corrupt the value. The column is timestamp WITHOUT time zone
// so Postgres compares these as literal calendar values.
function startOfDay(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new BadRequestException(`${field} is not a valid date (expected YYYY-MM-DD)`);
  return `${value} 00:00:00`;
}

function endOfDay(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new BadRequestException(`${field} is not a valid date (expected YYYY-MM-DD)`);
  return `${value} 23:59:59.999`;
}

@Injectable()
export class Form3Service {
  constructor(
    @InjectRepository(Form3ResponseEntity)
    private readonly repo: Repository<Form3ResponseEntity>,
    @InjectRepository(FormTemplateEntity)
    private readonly templateRepo: Repository<FormTemplateEntity>,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantId: string, dto: CreateForm3Dto, ctx?: AuditContext): Promise<Form3Response> {
    const template = await this.templateRepo.findOne({
      where: { tenantId, slug: dto.formType, active: true },
    });
    if (!template) {
      throw new BadRequestException(
        `Formulário '${dto.formType}' não encontrado ou inativo para este tenant`,
      );
    }
    const cpf = dto.patientCpf ?? null;
    const justificativa = cpf ? null : (dto.cpfJustificativa ?? null);

    if (!cpf && !justificativa && !dto.recusouResponder) {
      throw new BadRequestException(
        'Justificativa é obrigatória quando o CPF não é informado',
      );
    }

    const form = this.repo.create({
      ...dto,
      tenantId,
      patientCpf: cpf,
      cpfJustificativa: justificativa,
      comments: dto.comments ?? '',
      recusouResponder: dto.recusouResponder ?? false,
    });
    const saved = await this.repo.save(form);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'FORM_CREATED',
      'form3_response',
      saved.id,
      { formType: dto.formType, hasCpf: !!cpf, recusouResponder: dto.recusouResponder ?? false },
    );

    return saved;
  }

  async findAll(
    tenantId: string,
    filters?: FilterForm3Dto,
  ): Promise<{ data: Form3Response[]; total: number; page: number; limit: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;

    const qb = this.repo.createQueryBuilder('form');
    qb.where('form.tenantId = :tenantId', { tenantId });

    if (filters?.startDate) {
      qb.andWhere('form.createdAt >= :startDate', { startDate: startOfDay(filters.startDate, 'startDate') });
    }
    if (filters?.endDate) {
      qb.andWhere('form.createdAt <= :endDate', { endDate: endOfDay(filters.endDate, 'endDate') });
    }
    if (filters?.formType) {
      qb.andWhere('form.formType = :formType', { formType: filters.formType });
    }
    if (filters?.sortSatisfaction) {
      const direction = filters.sortSatisfaction === 'desc' ? 'DESC' : 'ASC';
      qb.addSelect(
        `(
          SELECT AVG((elem->>'value')::float)
          FROM jsonb_array_elements(form.answers) AS elem
          WHERE elem->>'questionId' != 'nps'
        )`,
        'avg_score',
      );
      qb.orderBy('avg_score', direction);
    } else {
      qb.orderBy('form.createdAt', 'DESC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const mapped = data.map((r) => ({
      ...r,
      patientCpf: filters?.includeCpf ? r.patientCpf : maskCpf(r.patientCpf),
    }));
    return { data: mapped, total, page, limit };
  }

  async findById(tenantId: string, id: string): Promise<Form3Response> {
    const form = await this.repo.findOne({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Formulário não encontrado');
    return { ...form, patientCpf: maskCpf(form.patientCpf) };
  }

  /** Soft-delete a single response. Only deletes if it belongs to the tenant. */
  async softDeleteOne(tenantId: string, id: string, ctx?: AuditContext): Promise<{ deleted: number }> {
    const form = await this.repo.findOne({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Formulário não encontrado');
    await this.repo.softDelete(id);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'FORM_DELETED',
      'form3_response',
      id,
    );

    return { deleted: 1 };
  }

  /** Hard-delete all responses for a tenant (bulk wipe — requires holding_admin or hospital_admin). */
  async deleteAll(tenantId: string, ctx?: AuditContext): Promise<{ deleted: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(Form3ResponseEntity)
      .where('tenantId = :tenantId', { tenantId })
      .execute();

    await this.auditLog.record(
      ctx ?? { tenantId },
      'FORM_BULK_DELETED',
      'form3_response',
      null,
      { affected: result.affected ?? 0 },
    );

    return { deleted: result.affected ?? 0 };
  }

  /** Retroactively add CPF to a response submitted without one (holding_admin only). */
  async updateCpf(tenantId: string, id: string, dto: UpdateCpfDto, ctx?: AuditContext): Promise<Form3Response> {
    const form = await this.repo.findOne({ where: { id, tenantId } });
    if (!form) throw new NotFoundException('Formulário não encontrado');
    if (form.patientCpf !== null) {
      throw new BadRequestException('Este formulário já possui CPF cadastrado');
    }

    form.patientCpf = dto.patientCpf;
    form.cpfAddedAt = new Date();
    const saved = await this.repo.save(form);

    await this.auditLog.record(
      ctx ?? { tenantId },
      'FORM_CPF_UPDATED',
      'form3_response',
      id,
    );

    return { ...saved, patientCpf: maskCpf(saved.patientCpf) };
  }

  async getMetrics(tenantId: string, filters?: FilterForm3Dto) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Base filter query builder (reused for all aggregations)
    const buildBase = () => {
      const qb = this.repo.createQueryBuilder('form');
      qb.where('form.tenantId = :tenantId', { tenantId });
      qb.andWhere('form."recusouResponder" = false');
      if (filters?.startDate) {
        qb.andWhere('form.createdAt >= :startDate', { startDate: startOfDay(filters.startDate, 'startDate') });
      }
      if (filters?.endDate) {
        qb.andWhere('form.createdAt <= :endDate', { endDate: endOfDay(filters.endDate, 'endDate') });
      }
      if (filters?.formType) {
        qb.andWhere('form.formType = :formType', { formType: filters.formType });
      }
      return qb;
    };

    // All aggregations in a single SQL query
    const row = await buildBase()
      .select('COUNT(*)', 'totalResponses')
      .addSelect(
        `AVG(
          (SELECT AVG((elem->>'value')::float)
           FROM jsonb_array_elements(form.answers) AS elem
           WHERE elem->>'questionId' != 'nps')
        )`,
        'avgSatisfaction',
      )
      .addSelect(
        `CASE WHEN COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM jsonb_array_elements(form.answers) AS elem
            WHERE elem->>'questionId' = 'nps'
          )) = 0 THEN NULL
         ELSE ROUND(
           100.0 * COUNT(*) FILTER (WHERE EXISTS (
             SELECT 1 FROM jsonb_array_elements(form.answers) AS elem
             WHERE elem->>'questionId' = 'nps' AND (elem->>'value')::int = 1
           )) / COUNT(*) FILTER (WHERE EXISTS (
             SELECT 1 FROM jsonb_array_elements(form.answers) AS elem
             WHERE elem->>'questionId' = 'nps'
           ))
         , 1)
        END`,
        'avgNps',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE form.createdAt >= :thisMonthStart)`,
        'responsesThisMonth',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE form.createdAt >= :lastMonthStart AND form.createdAt <= :lastMonthEnd)`,
        'responsesLastMonth',
      )
      .setParameter('thisMonthStart', thisMonthStart)
      .setParameter('lastMonthStart', lastMonthStart)
      .setParameter('lastMonthEnd', lastMonthEnd)
      .getRawOne<{
        totalResponses: string;
        avgSatisfaction: string | null;
        avgNps: string | null;
        responsesThisMonth: string;
        responsesLastMonth: string;
      }>();

    return {
      totalResponses: parseInt(row?.totalResponses ?? '0', 10),
      averageSatisfaction: Math.round((parseFloat(row?.avgSatisfaction ?? '0') || 0) * 10) / 10,
      averageNps: parseFloat(row?.avgNps ?? '0') || 0, // % de Sim (0–100)
      responsesThisMonth: parseInt(row?.responsesThisMonth ?? '0', 10),
      responsesLastMonth: parseInt(row?.responsesLastMonth ?? '0', 10),
    };
  }
}
