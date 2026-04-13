/**
 * Tenant Isolation Tests — Training Module
 *
 * Verifica que TrainingSessionsService e TrainingResponsesService sempre
 * escopam queries ao tenantId correto e nunca vazam dados entre tenants.
 *
 * Todos os calls ao DB são mockados — sem banco real.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { TrainingSessionsService } from './training-sessions.service';
import { TrainingResponsesService } from './training-responses.service';
import { TrainingSessionEntity } from './training-session.entity';
import { TrainingResponseEntity } from './training-response.entity';
import { TenantService } from '../tenants/tenant.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const mockAuditLog = { record: jest.fn().mockResolvedValue(undefined) };

const TENANT_A = 'aaaaaaaa-0000-0000-0000-000000000001';
const TENANT_B = 'bbbbbbbb-0000-0000-0000-000000000002';

function buildQbChain(rawResult: unknown = null, manyResult: [unknown[], number] = [[], 0]) {
  const qb: Record<string, jest.Mock> = {};
  const methods = [
    'where', 'andWhere', 'select', 'addSelect', 'setParameter',
    'orderBy', 'leftJoinAndSelect',
  ];
  methods.forEach((m) => { qb[m] = jest.fn().mockReturnValue(qb); });
  qb['getRawOne'] = jest.fn().mockResolvedValue(rawResult);
  qb['getManyAndCount'] = jest.fn().mockResolvedValue(manyResult);
  return qb;
}

const mockTenantServiceA = {
  findBySlug: jest.fn().mockResolvedValue({ id: TENANT_A, slug: 'tenant-a' }),
  resolveId: jest.fn().mockResolvedValue(TENANT_A),
};

const mockTenantServiceB = {
  findBySlug: jest.fn().mockResolvedValue({ id: TENANT_B, slug: 'tenant-b' }),
  resolveId: jest.fn().mockResolvedValue(TENANT_B),
};

// ─── TrainingSessionsService Isolation ──────────────────────────────────────

describe('Tenant Isolation — TrainingSessionsService', () => {
  let serviceA: TrainingSessionsService;
  let serviceB: TrainingSessionsService;
  let repoMockA: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock; find: jest.Mock; remove: jest.Mock };
  let repoMockB: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock; find: jest.Mock; remove: jest.Mock };

  function makeSessionRepo() {
    return {
      create: jest.fn().mockImplementation((x) => x),
      save: jest.fn().mockImplementation((x) => Promise.resolve({ ...x, id: 'new-id' })),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      remove: jest.fn().mockResolvedValue({}),
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    repoMockA = makeSessionRepo();
    repoMockB = makeSessionRepo();

    const moduleA = await Test.createTestingModule({
      providers: [
        TrainingSessionsService,
        { provide: getRepositoryToken(TrainingSessionEntity), useValue: repoMockA },
        { provide: TenantService, useValue: mockTenantServiceA },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();
    serviceA = moduleA.get<TrainingSessionsService>(TrainingSessionsService);

    const moduleB = await Test.createTestingModule({
      providers: [
        TrainingSessionsService,
        { provide: getRepositoryToken(TrainingSessionEntity), useValue: repoMockB },
        { provide: TenantService, useValue: mockTenantServiceB },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();
    serviceB = moduleB.get<TrainingSessionsService>(TrainingSessionsService);
  });

  describe('create()', () => {
    const dto = {
      title: 'Treinamento Isolado',
      trainingDate: '2026-01-01',
      trainingType: 'reacao' as const,
      instructor: 'Prof Teste',
    };

    it('stampa TENANT_A ao criar via serviceA', async () => {
      await serviceA.create('tenant-a', dto);
      expect(repoMockA.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A }),
      );
      expect(repoMockA.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_B }),
      );
    });

    it('stampa TENANT_B ao criar via serviceB', async () => {
      await serviceB.create('tenant-b', dto);
      expect(repoMockB.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_B }),
      );
      expect(repoMockB.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A }),
      );
    });
  });

  describe('findAll()', () => {
    it('busca com WHERE tenantId = TENANT_A', async () => {
      await serviceA.findAll('tenant-a');
      expect(repoMockA.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT_A } }),
      );
    });

    it('busca com WHERE tenantId = TENANT_B — não usa TENANT_A', async () => {
      await serviceB.findAll('tenant-b');
      expect(repoMockB.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT_B } }),
      );
      expect(repoMockB.find).not.toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: TENANT_A } }),
      );
    });
  });

  describe('remove()', () => {
    it('findOne usa tenantId correto antes de remover', async () => {
      repoMockA.findOne.mockResolvedValue(null);
      await expect(serviceA.remove('tenant-a', 'qualquer-slug')).rejects.toThrow(NotFoundException);
      expect(repoMockA.findOne).toHaveBeenCalledWith({
        where: { tenantId: TENANT_A, slug: 'qualquer-slug' },
      });
      expect(repoMockA.remove).not.toHaveBeenCalled();
    });
  });
});

// ─── TrainingResponsesService Isolation ──────────────────────────────────────

describe('Tenant Isolation — TrainingResponsesService', () => {
  let service: TrainingResponsesService;
  let repoMock: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    softDelete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let activeQb: ReturnType<typeof buildQbChain>;

  beforeEach(async () => {
    jest.clearAllMocks();
    activeQb = buildQbChain(
      { totalResponses: '0', avgSatisfaction: null, avgNps: null, responsesThisMonth: '0', responsesLastMonth: '0' },
    );

    repoMock = {
      create: jest.fn().mockImplementation((x) => x),
      save: jest.fn().mockImplementation((x) => Promise.resolve({ ...x, id: 'new-id' })),
      findOne: jest.fn().mockResolvedValue(null),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue(activeQb),
    };

    const sessionRepoMock = {
      findOne: jest.fn().mockResolvedValue({
        id: 'session-id-1', tenantId: TENANT_A, slug: 'treinamento', active: true,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingResponsesService,
        { provide: getRepositoryToken(TrainingResponseEntity), useValue: repoMock },
        { provide: getRepositoryToken(TrainingSessionEntity), useValue: sessionRepoMock },
        { provide: TenantService, useValue: mockTenantServiceA },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<TrainingResponsesService>(TrainingResponsesService);
  });

  describe('create()', () => {
    it('stampa tenantId = TENANT_A na resposta criada', async () => {
      await service.create('tenant-a', { sessionSlug: 'treinamento', answers: [] } as any);
      expect(repoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_A }),
      );
      expect(repoMock.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT_B }),
      );
    });
  });

  describe('findAll()', () => {
    it('WHERE clause usa TENANT_A', async () => {
      await service.findAll('tenant-a');
      expect(activeQb.where).toHaveBeenCalledWith(
        'tr.tenantId = :tenantId',
        { tenantId: TENANT_A },
      );
    });

    it('WHERE clause não usa TENANT_B', async () => {
      await service.findAll('tenant-a');
      expect(activeQb.where).not.toHaveBeenCalledWith(
        expect.any(String),
        { tenantId: TENANT_B },
      );
    });
  });

  describe('getMetrics()', () => {
    it('query de métricas é sempre filtrada por TENANT_A', async () => {
      await service.getMetrics('tenant-a');
      expect(activeQb.where).toHaveBeenCalledWith(
        'tr.tenantId = :tenantId',
        { tenantId: TENANT_A },
      );
    });
  });

  describe('softDelete()', () => {
    it('findOne verifica tenantId antes de deletar — cross-tenant resulta em NotFoundException', async () => {
      repoMock.findOne.mockResolvedValue(null);

      await expect(service.softDelete('tenant-a', 'id-de-outro-tenant')).rejects.toThrow(
        NotFoundException,
      );
      expect(repoMock.softDelete).not.toHaveBeenCalled();
    });

    it('findOne é chamado com tenantId = TENANT_A', async () => {
      repoMock.findOne.mockResolvedValue(null);
      await expect(service.softDelete('tenant-a', 'any-id')).rejects.toThrow(NotFoundException);

      expect(repoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'any-id', tenantId: TENANT_A },
      });
    });
  });
});
