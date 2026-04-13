import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TrainingResponsesService } from './training-responses.service';
import { TrainingResponseEntity } from './training-response.entity';
import { TrainingSessionEntity } from './training-session.entity';
import { TenantService } from '../tenants/tenant.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const mockAuditLog = { record: jest.fn().mockResolvedValue(undefined) };

function mockRepo() {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

const mockTenantService = {
  findBySlug: jest.fn(),
  resolveId: jest.fn(),
};

function makeSession(tenantId: string, overrides: Partial<TrainingSessionEntity> = {}): TrainingSessionEntity {
  return {
    id: 'session-id-1',
    tenantId,
    slug: 'treinamento-slug',
    title: 'Treinamento',
    trainingDate: '2026-01-01',
    trainingType: 'reacao',
    instructor: 'Instrutor',
    active: true,
    linkedSessionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: null as any,
    ...overrides,
  };
}

function makeResponse(tenantId: string, overrides: Partial<TrainingResponseEntity> = {}): TrainingResponseEntity {
  return {
    id: 'response-' + Math.random(),
    tenantId,
    sessionId: 'session-id-1',
    respondentName: 'Colaborador Teste',
    answers: [{ questionId: 'q1', value: 4 }],
    pontoAlto: '',
    jaAplica: '',
    recomenda: null,
    recomendaMotivo: '',
    comments: '',
    createdAt: new Date(),
    deletedAt: null,
    tenant: null as any,
    session: null as any,
    ...overrides,
  };
}

function makeQbWithRawOne(rawRow: Record<string, string | null>) {
  const qb: Record<string, jest.Mock> = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getRawOne: jest.fn().mockResolvedValue(rawRow),
  };
  return qb;
}

describe('TrainingResponsesService', () => {
  let service: TrainingResponsesService;
  let repo: ReturnType<typeof mockRepo>;
  let sessionRepo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    repo = mockRepo();
    sessionRepo = mockRepo();
    jest.clearAllMocks();
    mockTenantService.resolveId.mockResolvedValue('tenant-id-1');
    mockTenantService.findBySlug.mockResolvedValue({ id: 'tenant-id-1', slug: 'hgm' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingResponsesService,
        { provide: getRepositoryToken(TrainingResponseEntity), useValue: repo },
        { provide: getRepositoryToken(TrainingSessionEntity), useValue: sessionRepo },
        { provide: TenantService, useValue: mockTenantService },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<TrainingResponsesService>(TrainingResponsesService);
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('salva resposta com tenantId e sessionId corretos', async () => {
      const session = makeSession('tenant-id-1');
      sessionRepo.findOne.mockResolvedValue(session);
      const dto = {
        sessionSlug: 'treinamento-slug',
        respondentName: 'João',
        answers: [{ questionId: 'q1', value: 5 }],
      };
      const created = { tenantId: 'tenant-id-1', sessionId: session.id, respondentName: 'João' };
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue({ ...created, id: 'resp-id' });

      const result = await service.create('hgm', dto as any);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-id-1', sessionId: session.id }),
      );
      expect(result.id).toBe('resp-id');
    });

    it('usa "Anônimo" quando respondentName não é fornecido', async () => {
      const session = makeSession('tenant-id-1');
      sessionRepo.findOne.mockResolvedValue(session);
      repo.create.mockImplementation((x) => x);
      repo.save.mockImplementation((x) => Promise.resolve({ ...x, id: 'id' }));

      await service.create('hgm', { sessionSlug: 'treinamento-slug', answers: [] } as any);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ respondentName: 'Anônimo' }),
      );
    });

    it('lança BadRequestException quando sessão está inativa', async () => {
      const session = makeSession('tenant-id-1', { active: false });
      sessionRepo.findOne.mockResolvedValue(session);

      await expect(
        service.create('hgm', { sessionSlug: 'treinamento-slug', answers: [] } as any),
      ).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lança BadRequestException quando sessão não existe', async () => {
      sessionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('hgm', { sessionSlug: 'inexistente', answers: [] } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('retorna data e total filtrados por tenantId', async () => {
      const responses = [makeResponse('tenant-id-1')];
      const qb = makeQbWithRawOne({});
      qb.getManyAndCount.mockResolvedValue([responses, 1]);
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('hgm');

      expect(qb.where).toHaveBeenCalledWith('tr.tenantId = :tenantId', { tenantId: 'tenant-id-1' });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
    });

    it('aplica filtro de sessionSlug quando fornecido', async () => {
      const session = makeSession('tenant-id-1');
      sessionRepo.findOne.mockResolvedValue(session);
      const qb = makeQbWithRawOne({});
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll('hgm', 'treinamento-slug');

      expect(qb.andWhere).toHaveBeenCalledWith(
        'tr.sessionId = :sessionId',
        { sessionId: session.id },
      );
    });

    it('aplica filtros de data quando fornecidos', async () => {
      const qb = makeQbWithRawOne({});
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll('hgm', undefined, { startDate: '2026-01-01', endDate: '2026-01-31' });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'tr.createdAt >= :startDate',
        { startDate: '2026-01-01' },
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'tr.createdAt <= :endDate',
        { endDate: '2026-01-31T23:59:59' },
      );
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('retorna resposta quando encontrada para o tenant', async () => {
      const response = makeResponse('tenant-id-1', { id: 'resp-abc' });
      repo.findOne.mockResolvedValue(response);

      const result = await service.findById('hgm', 'resp-abc');

      expect(result).toBe(response);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'resp-abc', tenantId: 'tenant-id-1' },
        relations: ['session'],
      });
    });

    it('lança NotFoundException quando resposta não encontrada', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('hgm', 'inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── softDelete ───────────────────────────────────────────────────────────────

  describe('softDelete()', () => {
    it('executa softDelete e retorna { deleted: 1 }', async () => {
      const response = makeResponse('tenant-id-1', { id: 'resp-del' });
      repo.findOne.mockResolvedValue(response);
      repo.softDelete.mockResolvedValue({ affected: 1 });

      const result = await service.softDelete('hgm', 'resp-del');

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'resp-del', tenantId: 'tenant-id-1' } });
      expect(repo.softDelete).toHaveBeenCalledWith('resp-del');
      expect(result).toEqual({ deleted: 1 });
    });

    it('lança NotFoundException e não chama softDelete quando resposta não pertence ao tenant', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.softDelete('hgm', 'id-de-outro-tenant')).rejects.toThrow(NotFoundException);
      expect(repo.softDelete).not.toHaveBeenCalled();
    });
  });

  // ─── getMetrics ───────────────────────────────────────────────────────────────

  describe('getMetrics()', () => {
    it('retorna métricas parseadas da query SQL', async () => {
      const qb = makeQbWithRawOne({
        totalResponses: '20',
        avgSatisfaction: '4.1',
        avgNps: '85.0',
        responsesThisMonth: '8',
        responsesLastMonth: '12',
      });
      repo.createQueryBuilder.mockReturnValue(qb);

      const metrics = await service.getMetrics('hgm');

      expect(metrics.totalResponses).toBe(20);
      expect(metrics.averageSatisfaction).toBe(4.1);
      expect(metrics.averageNps).toBe(85);
      expect(metrics.responsesThisMonth).toBe(8);
      expect(metrics.responsesLastMonth).toBe(12);
    });

    it('retorna zeros quando não há respostas', async () => {
      const qb = makeQbWithRawOne({
        totalResponses: '0',
        avgSatisfaction: null,
        avgNps: null,
        responsesThisMonth: '0',
        responsesLastMonth: '0',
      });
      repo.createQueryBuilder.mockReturnValue(qb);

      const metrics = await service.getMetrics('hgm');

      expect(metrics.totalResponses).toBe(0);
      expect(metrics.averageSatisfaction).toBe(0);
      expect(metrics.averageNps).toBe(0);
    });

    it('query é sempre filtrada por tenantId', async () => {
      const qb = makeQbWithRawOne({
        totalResponses: '0', avgSatisfaction: null,
        avgNps: null, responsesThisMonth: '0', responsesLastMonth: '0',
      });
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.getMetrics('hgm');

      expect(qb.where).toHaveBeenCalledWith('tr.tenantId = :tenantId', { tenantId: 'tenant-id-1' });
    });
  });
});
