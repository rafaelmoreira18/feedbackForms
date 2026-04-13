import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { TrainingSessionsService } from './training-sessions.service';
import { TrainingSessionEntity } from './training-session.entity';
import { TenantService } from '../tenants/tenant.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const mockAuditLog = { record: jest.fn().mockResolvedValue(undefined) };

function mockRepo() {
  return {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };
}

const mockTenantService = {
  findBySlug: jest.fn(),
  resolveId: jest.fn(),
};

function makeSession(tenantId: string, overrides: Partial<TrainingSessionEntity> = {}): TrainingSessionEntity {
  return {
    id: 'session-' + Math.random(),
    tenantId,
    slug: 'treinamento-20260101',
    title: 'Treinamento Teste',
    trainingDate: '2026-01-01',
    trainingType: 'reacao',
    instructor: 'Instrutor Teste',
    active: true,
    linkedSessionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: null as any,
    ...overrides,
  };
}

describe('TrainingSessionsService', () => {
  let service: TrainingSessionsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    repo = mockRepo();
    jest.clearAllMocks();
    mockTenantService.resolveId.mockResolvedValue('tenant-id-1');
    mockTenantService.findBySlug.mockResolvedValue({ id: 'tenant-id-1', slug: 'hgm' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingSessionsService,
        { provide: getRepositoryToken(TrainingSessionEntity), useValue: repo },
        { provide: TenantService, useValue: mockTenantService },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<TrainingSessionsService>(TrainingSessionsService);
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('cria sessão com tenantId e slug baseado no title + date', async () => {
      const dto = {
        title: 'Integração Novos',
        trainingDate: '2026-03-24',
        trainingType: 'reacao' as const,
        instructor: 'João',
      };
      repo.findOne.mockResolvedValue(null); // sem conflito de slug
      const created = { ...dto, tenantId: 'tenant-id-1', slug: 'integracao-novos-20260324' };
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue({ ...created, id: 'new-session-id' });

      const result = await service.create('hgm', dto);

      expect(mockTenantService.resolveId).toHaveBeenCalledWith('hgm');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-id-1', title: 'Integração Novos' }),
      );
      expect(result.id).toBe('new-session-id');
    });

    it('adiciona sufixo único ao slug quando já existe conflito', async () => {
      const dto = {
        title: 'Treinamento',
        trainingDate: '2026-01-01',
        trainingType: 'reacao' as const,
        instructor: 'Maria',
      };
      // Primeiro findOne retorna conflito, segundo (não acontece) seria null
      repo.findOne.mockResolvedValue(makeSession('tenant-id-1', { slug: 'treinamento-20260101' }));
      repo.create.mockImplementation((x) => x);
      repo.save.mockImplementation((x) => Promise.resolve({ ...x, id: 'new-id' }));

      await service.create('hgm', dto);

      const createArg = repo.create.mock.calls[0][0];
      // O slug deve ser diferente do slug base (contém sufixo)
      expect(createArg.slug).not.toBe('treinamento-20260101');
      expect(createArg.slug).toMatch(/^treinamento-20260101-/);
    });
  });

  // ─── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('retorna sessões do tenant em ordem decrescente de criação', async () => {
      const sessions = [makeSession('tenant-id-1'), makeSession('tenant-id-1')];
      repo.find.mockResolvedValue(sessions);

      const result = await service.findAll('hgm');

      expect(repo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });
  });

  // ─── findBySlug ───────────────────────────────────────────────────────────────

  describe('findBySlug()', () => {
    it('retorna a sessão quando encontrada', async () => {
      const session = makeSession('tenant-id-1', { slug: 'meu-treinamento' });
      repo.findOne.mockResolvedValue(session);

      const result = await service.findBySlug('hgm', 'meu-treinamento');

      expect(result).toBe(session);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id-1', slug: 'meu-treinamento' },
      });
    });

    it('lança NotFoundException quando não encontrada', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('hgm', 'inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('atualiza campos sem mudar slug quando title não muda', async () => {
      const session = makeSession('tenant-id-1', { slug: 'original-20260101' });
      repo.findOne.mockResolvedValue(session);
      repo.save.mockResolvedValue({ ...session, instructor: 'Novo Instrutor' });

      await service.update('hgm', 'original-20260101', { instructor: 'Novo Instrutor' });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ instructor: 'Novo Instrutor', slug: 'original-20260101' }),
      );
    });

    it('recalcula slug quando title muda', async () => {
      const session = makeSession('tenant-id-1', { slug: 'titulo-antigo-20260101', title: 'Título Antigo' });
      // Primeiro findOne: busca a sessão; segundo: verifica conflito do novo slug
      repo.findOne
        .mockResolvedValueOnce(session)
        .mockResolvedValueOnce(null); // sem conflito
      repo.save.mockImplementation((x) => Promise.resolve(x));

      await service.update('hgm', 'titulo-antigo-20260101', { title: 'Título Novo' });

      const saved = repo.save.mock.calls[0][0];
      expect(saved.slug).toContain('titulo-novo');
      expect(saved.slug).not.toBe('titulo-antigo-20260101');
    });

    it('lança NotFoundException quando sessão não existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('hgm', 'inexistente', { instructor: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────────

  describe('remove()', () => {
    it('remove a sessão e retorna { deleted: 1 }', async () => {
      const session = makeSession('tenant-id-1');
      repo.findOne.mockResolvedValue(session);
      repo.remove.mockResolvedValue(session);

      const result = await service.remove('hgm', session.slug);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id-1', slug: session.slug },
      });
      expect(repo.remove).toHaveBeenCalledWith(session);
      expect(result).toEqual({ deleted: 1 });
    });

    it('lança NotFoundException quando sessão não encontrada', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('hgm', 'inexistente')).rejects.toThrow(NotFoundException);
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  // ─── createEficacia ──────────────────────────────────────────────────────────

  describe('createEficacia()', () => {
    it('cria sessão de eficácia com data = reação + 30 dias', async () => {
      const reacao = makeSession('tenant-id-1', {
        slug: 'treinamento-reacao',
        trainingDate: '2026-01-01',
        trainingType: 'reacao',
        title: 'Treinamento X',
        instructor: 'Prof Y',
      });
      // findOne: reação, depois checa linked, depois checa conflito de slug
      repo.findOne
        .mockResolvedValueOnce(reacao)   // busca reação
        .mockResolvedValueOnce(null)      // sem eficácia vinculada
        .mockResolvedValueOnce(null);     // sem conflito de slug
      repo.create.mockImplementation((x) => x);
      repo.save.mockImplementation((x) => Promise.resolve({ ...x, id: 'eficacia-id' }));

      const result = await service.createEficacia('hgm', 'treinamento-reacao');

      expect(result.trainingType).toBe('eficacia');
      expect(result.trainingDate).toBe('2026-01-31'); // 2026-01-01 + 30 dias
      expect(result.linkedSessionId).toBe(reacao.id);
    });

    it('lança BadRequestException se sessão não é do tipo reação', async () => {
      const eficacia = makeSession('tenant-id-1', { trainingType: 'eficacia' });
      repo.findOne.mockResolvedValue(eficacia);
      await expect(service.createEficacia('hgm', eficacia.slug)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança ConflictException se eficácia já existe para esta reação', async () => {
      const reacao = makeSession('tenant-id-1', { trainingType: 'reacao' });
      const eficaciaExistente = makeSession('tenant-id-1', { trainingType: 'eficacia' });
      repo.findOne
        .mockResolvedValueOnce(reacao)
        .mockResolvedValueOnce(eficaciaExistente); // já vinculada
      await expect(service.createEficacia('hgm', reacao.slug)).rejects.toThrow(
        ConflictException,
      );
    });

    it('lança NotFoundException se a sessão de reação não existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.createEficacia('hgm', 'inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
