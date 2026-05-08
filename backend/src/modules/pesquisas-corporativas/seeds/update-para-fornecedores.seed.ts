import { v4 as uuid } from 'uuid';
import { PesquisaBloco } from '../entities/pesquisa-corporativa.entity';

/**
 * Atualiza todas as pesquisas "Clima e Soft Skills 2026" por unidade para
 * "Pesquisa de Satisfação de Fornecedores", substituindo título, slug, tipo,
 * período, categoria e blocos.
 *
 * Execução: npx ts-node src/modules/pesquisas-corporativas/seeds/update-para-fornecedores.seed.ts
 * Idempotente: ignora unidades que já possuem o novo slug.
 */

const SLUG_ANTIGO_BASE = 'clima-soft-skills-2026';
const SLUG_NOVO_BASE   = 'satisfacao-fornecedores-2026';
const TITULO_NOVO      = 'Pesquisa de Satisfação de Fornecedores';
const TIPO_NOVO        = 'fornecedores';
const PERIODO_NOVO     = 'Anual 2026';
const CATEGORIA_NOVA   = 'Fornecedores';

function makeBlocos(): PesquisaBloco[] {
  return [
    {
      id: uuid(),
      titulo: '1. Comunicação e relacionamento',
      ordem: 1,
      perguntas: [
        { id: uuid(), texto: 'Clareza nas informações repassadas pela Organização',          escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Facilidade de contato com os responsáveis internos',            escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Cordialidade no relacionamento com a equipe',                   escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Retorno às solicitações, dúvidas ou pendências',                escala: 'likert5', obrigatoria: true, ordem: 4 },
        { id: uuid(), texto: 'Transparência na comunicação sobre demandas e prazos',          escala: 'likert5', obrigatoria: true, ordem: 5 },
      ],
    },
    {
      id: uuid(),
      titulo: '2. Processo de contratação e negociação',
      ordem: 2,
      perguntas: [
        { id: uuid(), texto: 'Clareza das condições comerciais acordadas',                                   escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Organização do processo de compra/contratação',                                escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Formalização adequada dos pedidos, contratos ou propostas',                    escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Cumprimento das condições negociadas',                                         escala: 'likert5', obrigatoria: true, ordem: 4 },
        { id: uuid(), texto: 'Facilidade para tratativas comerciais',                                        escala: 'likert5', obrigatoria: true, ordem: 5 },
      ],
    },
    {
      id: uuid(),
      titulo: '3. Recebimento de produtos e/ou serviços',
      ordem: 3,
      perguntas: [
        { id: uuid(), texto: 'Clareza das especificações técnicas solicitadas',                              escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Planejamento adequado das demandas',                                           escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Condições para entrega de produtos ou execução de serviços',                   escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Disponibilidade da equipe para alinhamentos técnicos',                         escala: 'likert5', obrigatoria: true, ordem: 4 },
        { id: uuid(), texto: 'Tratamento dado a eventuais não conformidades',                                escala: 'likert5', obrigatoria: true, ordem: 5 },
      ],
    },
    {
      id: uuid(),
      titulo: '4. Pagamento e aspectos administrativos',
      ordem: 4,
      perguntas: [
        { id: uuid(), texto: 'Clareza quanto ao fluxo de emissão de notas fiscais',                         escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Cumprimento dos prazos de pagamento acordados',                                escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Facilidade de contato com o setor financeiro',                                 escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Organização dos documentos administrativos solicitados',                       escala: 'likert5', obrigatoria: true, ordem: 4 },
        { id: uuid(), texto: 'Resolução de pendências financeiras ou documentais',                           escala: 'likert5', obrigatoria: true, ordem: 5 },
      ],
    },
    {
      id: uuid(),
      titulo: '5. Imagem institucional e parceria',
      ordem: 5,
      perguntas: [
        { id: uuid(), texto: 'Confiança na relação com a Organização',                                      escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Ética e transparência no relacionamento',                                      escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Respeito aos acordos estabelecidos',                                           escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Percepção da Organização como parceira estratégica',                           escala: 'likert5', obrigatoria: true, ordem: 4 },
        { id: uuid(), texto: 'Interesse em manter ou ampliar a relação comercial',                           escala: 'likert5', obrigatoria: true, ordem: 5 },
      ],
    },
    {
      id: uuid(),
      titulo: '6. Avaliação geral',
      ordem: 6,
      perguntas: [
        { id: uuid(), texto: 'De forma geral, qual seu nível de satisfação com a Organização?',             escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Você recomendaria nossa Organização para outros fornecedores ou parceiros?',  escala: 'opcoes', opcoes: ['Sim', 'Não', 'Talvez'], obrigatoria: true, ordem: 2 },
      ],
    },
    {
      id: uuid(),
      titulo: '7. Questões abertas',
      ordem: 7,
      perguntas: [
        { id: uuid(), texto: 'Quais pontos positivos você identifica no relacionamento com a Organização?', escala: 'aberta', obrigatoria: false, ordem: 1 },
        { id: uuid(), texto: 'Quais oportunidades de melhoria você sugere?',                                escala: 'aberta', obrigatoria: false, ordem: 2 },
        { id: uuid(), texto: 'Houve alguma situação que dificultou a prestação do serviço ou fornecimento do produto?', escala: 'aberta', obrigatoria: false, ordem: 3 },
        { id: uuid(), texto: 'Comentários adicionais',                                                      escala: 'aberta', obrigatoria: false, ordem: 4 },
      ],
    },
  ];
}

async function run() {
  const { DataSource } = await import('typeorm');
  const { PesquisaCorporativaEntity } = await import('../entities/pesquisa-corporativa.entity');
  const { TenantEntity } = await import('../../tenants/tenant.entity');
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../../../.env') });

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [PesquisaCorporativaEntity, TenantEntity],
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false,
  });

  await ds.initialize();
  const repo = ds.getRepository(PesquisaCorporativaEntity);
  const tenantRepo = ds.getRepository(TenantEntity);

  const tenants = await tenantRepo.find({ where: { active: true }, order: { name: 'ASC' } });
  console.log(`\nUnidades encontradas: ${tenants.length}`);

  let atualizadas = 0;
  let ignoradas = 0;

  for (const tenant of tenants) {
    const slugNovo = `${SLUG_NOVO_BASE}-${tenant.slug}`;

    // Já foi migrada?
    const jaExiste = await repo.findOne({ where: { tenantId: tenant.id, slug: slugNovo } });
    if (jaExiste) {
      console.log(`  ↳ [${tenant.slug}] já existe — ignorado`);
      ignoradas++;
      continue;
    }

    // Remove qualquer pesquisa antiga de clima desta unidade
    const antigas = await repo.find({ where: { tenantId: tenant.id } });
    const deClima = antigas.filter(p => p.slug.startsWith(SLUG_ANTIGO_BASE));
    if (deClima.length > 0) {
      await repo.remove(deClima);
      console.log(`  🗑  [${tenant.slug}] ${deClima.length} pesquisa(s) de clima removida(s)`);
    }

    const nova = repo.create({
      tenantId:    tenant.id,
      titulo:      TITULO_NOVO,
      slug:        slugNovo,
      tipo:        TIPO_NOVO,
      periodo:     PERIODO_NOVO,
      ativa:       true,
      categoria:   CATEGORIA_NOVA,
      visibility:  'privada',
      allowedTenantIds: null,
      visivelParaUnidade: false,
      blocos:      makeBlocos(),
    });

    const saved = await repo.save(nova);
    console.log(`  ✓ [${tenant.slug}] criada — id: ${saved.id}`);
    atualizadas++;
  }

  // Remove linha global de clima (tenantId = null), se existir
  const globaisClima = await repo.find({ where: { tenantId: null as any } });
  const globaisParaRemover = globaisClima.filter(p => p.slug.startsWith(SLUG_ANTIGO_BASE));
  if (globaisParaRemover.length > 0) {
    await repo.remove(globaisParaRemover);
    console.log(`\n🗑  ${globaisParaRemover.length} linha(s) global(is) de clima removida(s).`);
  }

  console.log(`\nResumo: ${atualizadas} atualizada(s), ${ignoradas} ignorada(s).`);
  await ds.destroy();
}

if (require.main === module) {
  run().catch(e => { console.error(e); process.exit(1); });
}
