import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { AnxietyAssessmentsService } from './anxiety-assessments.service';
import { AnxietyAssessmentEntity } from './anxiety-assessment.entity';
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

function makeAssessment(
  tenantId: string,
  overrides: Partial<AnxietyAssessmentEntity> = {},
): AnxietyAssessmentEntity {
  return {
    id: 'anx-' + Math.random(),
    tenantId,
    createdByUserId: null,
    slug: 'joao-silva-20260623',
    colaboradorNome: 'João Silva',
    cargo: 'Enfermeiro',
    setor: 'UTI',
    dataAplicacao: '2026-06-23',
    baiRespostas: null,
    baiEscore: null,
    baiClassificacao: null,
    baiRespondidoEm: null,
    gad7Respostas: null,
    gad7Escore: null,
    gad7Classificacao: null,
    gad7RespondidoEm: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: null as never,
    ...overrides,
  };
}

function baiAnswers(value: number) {
  return Array.from({ length: 21 }, (_, i) => ({ itemId: i + 1, value }));
}
function gad7Answers(value: number) {
  return Array.from({ length: 7 }, (_, i) => ({ itemId: i + 1, value }));
}

describe('AnxietyAssessmentsService', () => {
  let service: AnxietyAssessmentsService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    repo = mockRepo();
    jest.clearAllMocks();
    mockTenantService.resolveId.mockResolvedValue('tenant-id-1');
    mockTenantService.findBySlug.mockResolvedValue({ id: 'tenant-id-1', slug: 'hgm' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnxietyAssessmentsService,
        { provide: getRepositoryToken(AnxietyAssessmentEntity), useValue: repo },
        { provide: TenantService, useValue: mockTenantService },
        { provide: AuditLogService, useValue: mockAuditLog },
      ],
    }).compile();

    service = module.get<AnxietyAssessmentsService>(AnxietyAssessmentsService);
  });

  // ─── create ───────────────────────────────────────────────────────────────────
  describe('create()', () => {
    const dto = { colaboradorNome: 'João Silva', cargo: 'Enfermeiro', setor: 'UTI', dataAplicacao: '2026-06-23' };

    it('cria com tenantId e slug = nome + data, ambos instrumentos vazios', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((x) => x);
      repo.save.mockImplementation((x) => Promise.resolve({ ...x, id: 'new-id' }));

      await service.create('hgm', dto, { tenantId: 'tenant-id-1', userId: 'rh-1' });

      expect(mockTenantService.resolveId).toHaveBeenCalledWith('hgm');
      const arg = repo.create.mock.calls[0][0];
      expect(arg.tenantId).toBe('tenant-id-1');
      expect(arg.slug).toBe('joao-silva-20260623');
      expect(arg.createdByUserId).toBe('rh-1');
      expect(arg.baiRespostas).toBeUndefined();
      expect(arg.gad7Respostas).toBeUndefined();
    });

    it('adiciona sufixo único quando o slug já existe', async () => {
      repo.findOne.mockResolvedValue(makeAssessment('tenant-id-1'));
      repo.create.mockImplementation((x) => x);
      repo.save.mockImplementation((x) => Promise.resolve({ ...x, id: 'new-id' }));

      await service.create('hgm', dto);

      const arg = repo.create.mock.calls[0][0];
      expect(arg.slug).toMatch(/^joao-silva-20260623-/);
      expect(arg.slug).not.toBe('joao-silva-20260623');
    });
  });

  // ─── findAll / findBySlug / findPublic ──────────────────────────────────────────
  describe('findAll()', () => {
    it('escopa por tenantId em ordem decrescente', async () => {
      repo.find.mockResolvedValue([makeAssessment('tenant-id-1')]);
      await service.findAll('hgm');
      expect(repo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findBySlug()', () => {
    it('lança NotFound quando não existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findBySlug('hgm', 'x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPublic()', () => {
    it('NÃO expõe escores/respostas e marca pendências corretamente', async () => {
      repo.findOne.mockResolvedValue(
        makeAssessment('tenant-id-1', {
          baiEscore: 30,
          baiClassificacao: 'grave',
          baiRespondidoEm: new Date(),
          baiRespostas: baiAnswers(2),
        }),
      );

      const view = await service.findPublic('hgm', 'joao-silva-20260623');

      expect(view).not.toHaveProperty('baiEscore');
      expect(view).not.toHaveProperty('baiRespostas');
      expect(view.baiPendente).toBe(false); // BAI já respondido
      expect(view.gad7Pendente).toBe(true); // GAD-7 ainda pendente
      expect(view.colaboradorNome).toBe('João Silva');
    });
  });

  // ─── submit ─────────────────────────────────────────────────────────────────────
  describe('submit()', () => {
    it('calcula escore + classificação do BAI e marca respondido', async () => {
      const a = makeAssessment('tenant-id-1');
      repo.findOne.mockResolvedValue(a);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      await service.submit('hgm', a.slug, { instrument: 'bai', answers: baiAnswers(1) });

      expect(a.baiEscore).toBe(21);
      expect(a.baiClassificacao).toBe('moderada');
      expect(a.baiRespondidoEm).toBeInstanceOf(Date);
      expect(a.gad7RespondidoEm).toBeNull();
    });

    it('calcula escore + classificação do GAD-7', async () => {
      const a = makeAssessment('tenant-id-1');
      repo.findOne.mockResolvedValue(a);
      repo.save.mockImplementation((x) => Promise.resolve(x));

      const view = await service.submit('hgm', a.slug, { instrument: 'gad7', answers: gad7Answers(3) });

      expect(a.gad7Escore).toBe(21);
      expect(a.gad7Classificacao).toBe('grave');
      expect(view.gad7Pendente).toBe(false);
    });

    it('rejeita quantidade errada de respostas', async () => {
      const a = makeAssessment('tenant-id-1');
      repo.findOne.mockResolvedValue(a);
      await expect(
        service.submit('hgm', a.slug, { instrument: 'bai', answers: gad7Answers(1) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita itens duplicados/faltantes', async () => {
      const a = makeAssessment('tenant-id-1');
      repo.findOne.mockResolvedValue(a);
      const dup = Array.from({ length: 7 }, () => ({ itemId: 1, value: 1 }));
      await expect(
        service.submit('hgm', a.slug, { instrument: 'gad7', answers: dup }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejeita reenvio de um instrumento já respondido', async () => {
      const a = makeAssessment('tenant-id-1', { gad7RespondidoEm: new Date() });
      repo.findOne.mockResolvedValue(a);
      await expect(
        service.submit('hgm', a.slug, { instrument: 'gad7', answers: gad7Answers(1) }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita submissão em link inativo', async () => {
      const a = makeAssessment('tenant-id-1', { active: false });
      repo.findOne.mockResolvedValue(a);
      await expect(
        service.submit('hgm', a.slug, { instrument: 'bai', answers: baiAnswers(0) }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança NotFound quando a aplicação não existe', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.submit('hgm', 'inexistente', { instrument: 'bai', answers: baiAnswers(0) }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────────
  describe('remove()', () => {
    it('verifica tenantId antes de remover (cross-tenant → NotFound)', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('hgm', 'id-de-outro-tenant')).rejects.toThrow(NotFoundException);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id-1', slug: 'id-de-outro-tenant' },
      });
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('remove e retorna { deleted: 1 }', async () => {
      const a = makeAssessment('tenant-id-1');
      repo.findOne.mockResolvedValue(a);
      repo.remove.mockResolvedValue(a);
      const result = await service.remove('hgm', a.slug);
      expect(result).toEqual({ deleted: 1 });
    });
  });
});
