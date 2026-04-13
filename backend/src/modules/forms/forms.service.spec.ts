import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Form3Service } from './forms.service';
import { Form3ResponseEntity } from './forms.entity';
import { FormTemplateEntity } from '../form-templates/form-template.entity';
import type { Form3Answer } from './forms.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

// Minimal mock repository factory
function mockRepo() {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

const mockAuditLog = { record: jest.fn().mockResolvedValue(undefined) };

// Helper to create a minimal Form3ResponseEntity
function makeForm(
  tenantId: string,
  formType: string,
  answers: Form3Answer[],
  overrides: Partial<Form3ResponseEntity> = {},
): Form3ResponseEntity {
  return {
    id: 'uuid-' + Math.random(),
    tenantId,
    formType,
    patientName: 'Paciente Teste',
    patientCpf: '52998224725',
    cpfJustificativa: null,
    cpfAddedAt: null,
    patientAge: 45,
    patientGender: 'Masculino',
    admissionDate: '2026-01-01',
    dischargeDate: '2026-01-05',
    evaluatedDepartment: formType,
    answers,
    comments: '',
    recusouResponder: false,
    createdAt: new Date(),
    deletedAt: null,
    tenant: null as any,
    ...overrides,
  };
}

describe('Form3Service', () => {
  let service: Form3Service;
  let repo: ReturnType<typeof mockRepo>;
  let templateRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    repo = mockRepo();
    templateRepo = mockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Form3Service,
        { provide: getRepositoryToken(Form3ResponseEntity), useValue: repo },
        { provide: getRepositoryToken(FormTemplateEntity), useValue: templateRepo },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<Form3Service>(Form3Service);
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('saves a new form with the provided tenantId', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 'tmpl-1', slug: 'uti', active: true });
      const dto = {
        formType: 'uti',
        patientName: 'Maria',
        patientCpf: '52998224725',
        patientAge: 30,
        patientGender: 'Feminino' as const,
        admissionDate: '2026-01-01',
        dischargeDate: '2026-01-02',
        evaluatedDepartment: 'UTI',
        answers: [{ questionId: 'q1', value: 4 }],
      };
      const created = { ...dto, tenantId: 'tenant-1', comments: '' };
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue({ ...created, id: 'new-id' });

      const result = await service.create('tenant-1', dto as any);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', formType: 'uti' }),
      );
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result.id).toBe('new-id');
    });

    it('defaults comments to empty string when not provided', async () => {
      templateRepo.findOne.mockResolvedValue({ id: 'tmpl-1', slug: 'uti', active: true });
      const dto = {
        formType: 'uti', patientName: 'X', patientCpf: '52998224725',
        patientAge: 20, patientGender: 'Outro' as const, admissionDate: '2026-01-01',
        dischargeDate: '2026-01-02', evaluatedDepartment: 'UTI', answers: [],
      };
      repo.create.mockReturnValue({ ...dto, tenantId: 't', comments: '' });
      repo.save.mockResolvedValue({ id: 'id1' });

      await service.create('t', dto as any);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ comments: '' }),
      );
    });
  });

  // ─── findById ───────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('returns the form when found for the tenant', async () => {
      const form = makeForm('tenant-a', 'uti', []);
      repo.findOne.mockResolvedValue(form);

      const result = await service.findById('tenant-a', form.id);
      // CPF is masked in the response — use objectContaining instead of toBe
      expect(result).toEqual(expect.objectContaining({ id: form.id, tenantId: 'tenant-a' }));
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: form.id, tenantId: 'tenant-a' },
      });
    });

    it('throws NotFoundException when form does not exist for this tenant', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('tenant-a', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when form belongs to a different tenant (tenant isolation)', async () => {
      // Simulate tenant-b's form not visible to tenant-a's query
      repo.findOne.mockResolvedValue(null);
      const formB = makeForm('tenant-b', 'uti', []);

      await expect(service.findById('tenant-a', formB.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── softDeleteOne ───────────────────────────────────────────────────────────

  describe('softDeleteOne()', () => {
    it('soft-deletes an existing form owned by the tenant', async () => {
      const form = makeForm('tenant-a', 'uti', []);
      repo.findOne.mockResolvedValue(form);
      repo.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.softDeleteOne('tenant-a', form.id);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: form.id, tenantId: 'tenant-a' },
      });
      expect(repo.softDelete).toHaveBeenCalledWith(form.id);
      expect(result).toEqual({ deleted: 1 });
    });

    it('throws NotFoundException if the form does not belong to this tenant (tenant isolation)', async () => {
      repo.findOne.mockResolvedValue(null); // tenant-a cannot see tenant-b form
      await expect(service.softDeleteOne('tenant-a', 'tenant-b-form-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });

  // ─── getMetrics ──────────────────────────────────────────────────────────────

  describe('getMetrics()', () => {
    function makeQbWithRawOne(rawRow: Record<string, string | null>) {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(rawRow),
      };
      repo.createQueryBuilder.mockReturnValue(qb);
      return qb;
    }

    it('returns parsed numeric metrics from the SQL aggregation row', async () => {
      makeQbWithRawOne({
        totalResponses: '42',
        avgSatisfaction: '3.5',
        avgNps: '7.8',
        responsesThisMonth: '10',
        responsesLastMonth: '8',
      });

      const metrics = await service.getMetrics('tenant-a');

      expect(metrics.totalResponses).toBe(42);
      expect(metrics.averageSatisfaction).toBe(3.5);
      expect(metrics.averageNps).toBe(7.8);
      expect(metrics.responsesThisMonth).toBe(10);
      expect(metrics.responsesLastMonth).toBe(8);
    });

    it('returns zeros when the SQL row is empty (no responses yet)', async () => {
      makeQbWithRawOne({
        totalResponses: '0',
        avgSatisfaction: null,
        avgNps: null,
        responsesThisMonth: '0',
        responsesLastMonth: '0',
      });

      const metrics = await service.getMetrics('tenant-a');

      expect(metrics.totalResponses).toBe(0);
      expect(metrics.averageSatisfaction).toBe(0);
      expect(metrics.averageNps).toBe(0);
    });

    it('rounds averageSatisfaction to one decimal place', async () => {
      makeQbWithRawOne({
        totalResponses: '5',
        avgSatisfaction: '3.1666666',
        avgNps: '8.3333333',
        responsesThisMonth: '2',
        responsesLastMonth: '3',
      });

      const metrics = await service.getMetrics('tenant-a');

      expect(metrics.averageSatisfaction).toBe(3.2);
      // NPS comes from SQL ROUND() — returned as-is from the raw query
      expect(metrics.averageNps).toBe(8.3333333);
    });

    it('passes tenantId as a WHERE clause parameter', async () => {
      const qb = makeQbWithRawOne({
        totalResponses: '0', avgSatisfaction: null,
        avgNps: null, responsesThisMonth: '0', responsesLastMonth: '0',
      });

      await service.getMetrics('tenant-xyz');

      expect(qb.where).toHaveBeenCalledWith('form.tenantId = :tenantId', {
        tenantId: 'tenant-xyz',
      });
    });

    it('applies formType filter when provided', async () => {
      const qb = makeQbWithRawOne({
        totalResponses: '3', avgSatisfaction: '4.0',
        avgNps: '9.0', responsesThisMonth: '3', responsesLastMonth: '0',
      });

      await service.getMetrics('tenant-a', { formType: 'uti' } as any);

      expect(qb.andWhere).toHaveBeenCalledWith(
        'form.formType = :formType',
        { formType: 'uti' },
      );
    });
  });
});
