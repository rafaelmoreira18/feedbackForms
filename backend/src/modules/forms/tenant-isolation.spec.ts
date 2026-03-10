/**
 * Tenant Isolation Tests
 *
 * These tests verify that Form3Service always scopes queries to the correct
 * tenantId and never leaks data across tenant boundaries.
 *
 * All DB calls are mocked — no real database is needed.
 * The key invariant tested: service methods that accept tenantId MUST pass
 * that exact tenantId into every WHERE clause they build.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Form3Service } from './forms.service';
import { Form3ResponseEntity } from './forms.entity';

const TENANT_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const TENANT_B = 'bbbbbbbb-0000-0000-0000-000000000002';

function makeMockForm(tenantId: string, id = 'form-id-1'): Form3ResponseEntity {
  return {
    id,
    tenantId,
    formType: 'uti',
    patientName: 'Test',
    patientCpf: '52998224725',
    patientAge: 30,
    patientGender: 'Masculino',
    admissionDate: '2026-01-01',
    dischargeDate: '2026-01-02',
    evaluatedDepartment: 'UTI',
    answers: [{ questionId: 'q1', value: 4 }],
    comments: '',
    createdAt: new Date(),
    deletedAt: null,
    tenant: null as any,
  };
}

function buildQbChain(rawResult: unknown, manyResult: [unknown[], number] = [[], 0]) {
  const qb: Record<string, jest.Mock> = {};
  const chain = ['where', 'andWhere', 'select', 'addSelect', 'setParameter',
    'skip', 'take', 'orderBy', 'addOrderBy', 'delete', 'from', 'execute'];
  chain.forEach((m) => { qb[m] = jest.fn().mockReturnValue(qb); });
  qb['getRawOne'] = jest.fn().mockResolvedValue(rawResult);
  qb['getManyAndCount'] = jest.fn().mockResolvedValue(manyResult);
  return qb;
}

describe('Tenant Isolation — Form3Service', () => {
  let service: Form3Service;
  let repoMock: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let activeQb: ReturnType<typeof buildQbChain>;

  beforeEach(async () => {
    activeQb = buildQbChain(
      { totalResponses: '0', avgSatisfaction: null, avgNps: null, responsesThisMonth: '0', responsesLastMonth: '0' },
    );

    repoMock = {
      create: jest.fn().mockImplementation((x) => x),
      save: jest.fn().mockImplementation((x) => Promise.resolve({ ...x, id: 'new-id' })),
      findOne: jest.fn(),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(activeQb),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Form3Service,
        { provide: getRepositoryToken(Form3ResponseEntity), useValue: repoMock },
      ],
    }).compile();

    service = module.get<Form3Service>(Form3Service);
  });

  // ── create: tenantId always stamped on the new record ──────────────────────

  describe('create()', () => {
    it('stamps tenantId = TENANT_A on the created record, never TENANT_B', async () => {
      const dto = {
        formType: 'uti', patientName: 'P', patientCpf: '52998224725',
        patientAge: 25, patientGender: 'Outro' as const, admissionDate: '2026-01-01',
        dischargeDate: '2026-01-02', evaluatedDepartment: 'UTI', answers: [],
      };

      await service.create(TENANT_A, dto as any);

      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A }),
      );
      expect(repoMock.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_B }),
      );
    });
  });

  // ── findById: query always scoped to tenantId ────────────────────────────────

  describe('findById()', () => {
    it('queries using the caller tenantId — tenant A cannot see tenant B record', async () => {
      // Simulate: repo returns null when tenantId doesn't match
      repoMock.findOne.mockResolvedValue(null);

      await expect(service.findById(TENANT_A, 'some-form-id')).rejects.toThrow(NotFoundException);

      expect(repoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'some-form-id', tenantId: TENANT_A },
      });
    });

    it('returns the form only when tenantId matches', async () => {
      const formA = makeMockForm(TENANT_A);
      repoMock.findOne.mockResolvedValue(formA);

      const result = await service.findById(TENANT_A, formA.id);
      expect(result.tenantId).toBe(TENANT_A);
    });
  });

  // ── findAll: WHERE clause always includes tenantId ────────────────────────────

  describe('findAll()', () => {
    it('WHERE clause always receives the caller tenantId', async () => {
      await service.findAll(TENANT_A);
      expect(activeQb.where).toHaveBeenCalledWith(
        'form.tenantId = :tenantId',
        { tenantId: TENANT_A },
      );
    });

    it('TENANT_B query uses TENANT_B — does not bleed into TENANT_A query', async () => {
      const qbB = buildQbChain(null, [[], 0]);
      repoMock.createQueryBuilder.mockReturnValueOnce(qbB);

      await service.findAll(TENANT_B);
      expect(qbB.where).toHaveBeenCalledWith(
        'form.tenantId = :tenantId',
        { tenantId: TENANT_B },
      );
    });

    it('does NOT pass TENANT_A when called with TENANT_B', async () => {
      const qbB = buildQbChain(null, [[], 0]);
      repoMock.createQueryBuilder.mockReturnValue(qbB);

      await service.findAll(TENANT_B);
      expect(qbB.where).not.toHaveBeenCalledWith(
        expect.any(String),
        { tenantId: TENANT_A },
      );
    });
  });

  // ── getMetrics: aggregation scoped to tenantId ────────────────────────────────

  describe('getMetrics()', () => {
    it('metrics query is scoped to caller tenantId', async () => {
      await service.getMetrics(TENANT_A);
      expect(activeQb.where).toHaveBeenCalledWith(
        'form.tenantId = :tenantId',
        { tenantId: TENANT_A },
      );
    });

    it('metrics for TENANT_B uses TENANT_B — independent from TENANT_A', async () => {
      const qbB = buildQbChain({
        totalResponses: '5', avgSatisfaction: '3.0',
        avgNps: '7.0', responsesThisMonth: '2', responsesLastMonth: '3',
      });
      repoMock.createQueryBuilder.mockReturnValue(qbB);

      await service.getMetrics(TENANT_B);

      expect(qbB.where).toHaveBeenCalledWith(
        'form.tenantId = :tenantId',
        { tenantId: TENANT_B },
      );
      expect(qbB.where).not.toHaveBeenCalledWith(
        expect.any(String),
        { tenantId: TENANT_A },
      );
    });
  });

  // ── softDeleteOne: tenant check before deletion ────────────────────────────────

  describe('softDeleteOne()', () => {
    it('findOne uses tenantId to prevent cross-tenant deletion', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await expect(service.softDeleteOne(TENANT_A, 'tenant-b-form-id')).rejects.toThrow(
        NotFoundException,
      );
      // Critical: softDelete must NOT be called when ownership check fails
      expect(repoMock.softDelete).not.toHaveBeenCalled();
    });

    it('ownership check uses the caller tenantId, not the form tenantId', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.softDeleteOne(TENANT_A, 'any-id')).rejects.toThrow(NotFoundException);

      expect(repoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'any-id', tenantId: TENANT_A },
      });
    });

    it('allows deletion when tenantId correctly matches', async () => {
      const form = makeMockForm(TENANT_A);
      repoMock.findOne.mockResolvedValue(form);

      const result = await service.softDeleteOne(TENANT_A, form.id);
      expect(result).toEqual({ deleted: 1 });
      expect(repoMock.softDelete).toHaveBeenCalledWith(form.id);
    });
  });
});
