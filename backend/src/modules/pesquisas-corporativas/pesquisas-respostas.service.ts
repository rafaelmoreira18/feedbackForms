import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { PesquisaRespostaEntity } from './entities/pesquisa-resposta.entity';
import { PesquisaCorporativaEntity } from './entities/pesquisa-corporativa.entity';
import { TenantService } from '../tenants/tenant.service';
import { CreateRespostaDto } from './dto/create-resposta.dto';

@Injectable()
export class PesquisasRespostasService {
  constructor(
    @InjectRepository(PesquisaRespostaEntity)
    private readonly repo: Repository<PesquisaRespostaEntity>,
    @InjectRepository(PesquisaCorporativaEntity)
    private readonly pesquisaRepo: Repository<PesquisaCorporativaEntity>,
    private readonly tenantService: TenantService,
  ) {}

  private async resolvePesquisa(tenantSlug: string, slug: string): Promise<PesquisaCorporativaEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pesquisa = await this.pesquisaRepo.findOne({
      where: [{ tenantId, slug }, { tenantId: IsNull(), slug }],
    });
    if (!pesquisa) throw new NotFoundException('Pesquisa não encontrada');
    return pesquisa;
  }

  async submit(tenantSlug: string, slug: string, dto: CreateRespostaDto): Promise<PesquisaRespostaEntity> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const pesquisa = await this.resolvePesquisa(tenantSlug, slug);

    if (!pesquisa.ativa) {
      throw new BadRequestException('Esta pesquisa não está aceitando respostas no momento');
    }

    const resposta = this.repo.create({
      tenantId,
      pesquisaId: pesquisa.id,
      nomeRespondente: dto.nomeRespondente ?? 'Anônimo',
      metadados: dto.metadados ?? {},
      answers: dto.answers,
    });

    return this.repo.save(resposta);
  }

  async findAll(
    tenantSlug: string,
    slug: string,
  ): Promise<PesquisaRespostaEntity[]> {
    const pesquisa = await this.resolvePesquisa(tenantSlug, slug);
    return this.repo.find({
      where: { pesquisaId: pesquisa.id, deletedAt: IsNull() },
      order: { criadoEm: 'DESC' },
    });
  }

  async getMetricas(tenantSlug: string, slug: string) {
    const pesquisa = await this.resolvePesquisa(tenantSlug, slug);
    const respostas = await this.repo.find({
      where: { pesquisaId: pesquisa.id, deletedAt: IsNull() },
    });

    const total = respostas.length;
    if (total === 0) return { total, mediaGeral: null, porPergunta: {} };

    // Aggregate numeric answers per perguntaId
    const somas: Record<string, number[]> = {};
    for (const r of respostas) {
      for (const a of r.answers) {
        if (typeof a.valor === 'number') {
          if (!somas[a.perguntaId]) somas[a.perguntaId] = [];
          somas[a.perguntaId].push(a.valor);
        }
      }
    }

    const porPergunta: Record<string, { media: number; total: number }> = {};
    let somaTotal = 0;
    let countTotal = 0;
    for (const [id, valores] of Object.entries(somas)) {
      const media = valores.reduce((a, b) => a + b, 0) / valores.length;
      porPergunta[id] = { media: Math.round(media * 100) / 100, total: valores.length };
      somaTotal += valores.reduce((a, b) => a + b, 0);
      countTotal += valores.length;
    }

    return {
      total,
      mediaGeral: countTotal > 0 ? Math.round((somaTotal / countTotal) * 100) / 100 : null,
      porPergunta,
    };
  }

  async softDelete(tenantSlug: string, id: string): Promise<{ deleted: number }> {
    const tenantId = await this.tenantService.resolveId(tenantSlug);
    const resposta = await this.repo.findOne({ where: { id, tenantId, deletedAt: IsNull() } });
    if (!resposta) throw new NotFoundException('Resposta não encontrada');
    resposta.deletedAt = new Date();
    await this.repo.save(resposta);
    return { deleted: 1 };
  }
}
