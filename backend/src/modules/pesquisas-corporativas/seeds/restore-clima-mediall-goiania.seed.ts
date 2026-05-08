import { v4 as uuid } from 'uuid';
import { PesquisaBloco } from '../entities/pesquisa-corporativa.entity';

/**
 * Restaura a pesquisa "Clima e Soft Skills — Mediall 2026" da unidade mediall-goiania
 * com o ID original, para que as respostas restauradas via PITR do RDS continuem
 * referenciando a pesquisaId correta.
 *
 * Execução: npx ts-node src/modules/pesquisas-corporativas/seeds/restore-clima-mediall-goiania.seed.ts
 * Idempotente: não insere se o ID já existir.
 */

const PESQUISA_ID_ORIGINAL  = '2e6ad64f-1d4c-4f37-99a5-de8675dcf837';
const TENANT_ID_GOIANIA     = '4a5971b2-3eeb-4fcf-a848-872a10735785';
const SLUG                  = 'clima-soft-skills-2026-mediall-goiania';

function makeBlocos(): PesquisaBloco[] {
  return [
    {
      id: uuid(), titulo: 'Bloco 1 – Comunicação', ordem: 1,
      perguntas: [
        { id: uuid(), texto: 'Recebo informações claras para realizar meu trabalho',     escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'A comunicação entre os setores funciona bem',               escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Meu líder se comunica de forma clara e respeitosa',         escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Sinto que posso expressar minhas opiniões',                 escala: 'likert5', obrigatoria: true, ordem: 4 },
      ],
    },
    {
      id: uuid(), titulo: 'Bloco 2 – Liderança', ordem: 2,
      perguntas: [
        { id: uuid(), texto: 'Meu líder demonstra respeito pelos colaboradores',          escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Meu líder sabe lidar bem com situações de pressão',         escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Recebo feedbacks construtivos sobre meu trabalho',          escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Meu líder age de forma justa com a equipe',                 escala: 'likert5', obrigatoria: true, ordem: 4 },
      ],
    },
    {
      id: uuid(), titulo: 'Bloco 3 – Inteligência Emocional', ordem: 3,
      perguntas: [
        { id: uuid(), texto: 'As pessoas mantêm o controle emocional no ambiente de trabalho', escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Os conflitos são tratados de forma respeitosa',              escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Existe empatia entre os colaboradores',                      escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Sinto que o ambiente é emocionalmente saudável',             escala: 'likert5', obrigatoria: true, ordem: 4 },
      ],
    },
    {
      id: uuid(), titulo: 'Bloco 4 – Trabalho em Equipe', ordem: 4,
      perguntas: [
        { id: uuid(), texto: 'Existe colaboração entre os colegas',                        escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'As equipes trabalham de forma integrada',                    escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Posso contar com meus colegas quando preciso',               escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'O clima entre os colegas é positivo',                        escala: 'likert5', obrigatoria: true, ordem: 4 },
      ],
    },
    {
      id: uuid(), titulo: 'Bloco 5 – Adaptabilidade e Mudanças', ordem: 5,
      perguntas: [
        { id: uuid(), texto: 'As equipes lidam bem com mudanças',                          escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'As pessoas estão abertas a novas ideias',                    escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Mudanças são comunicadas de forma clara',                    escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Sinto que consigo me adaptar às demandas do trabalho',       escala: 'likert5', obrigatoria: true, ordem: 4 },
      ],
    },
    {
      id: uuid(), titulo: 'Bloco 6 – Foco em Resultados', ordem: 6,
      perguntas: [
        { id: uuid(), texto: 'As pessoas demonstram comprometimento com resultados',       escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Existe responsabilidade pelas entregas',                     escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Os processos ajudam no desempenho do trabalho',              escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Sinto que meu trabalho contribui para o resultado da empresa', escala: 'likert5', obrigatoria: true, ordem: 4 },
      ],
    },
    {
      id: uuid(), titulo: 'Bloco 7 – Cultura e Ambiente', ordem: 7,
      perguntas: [
        { id: uuid(), texto: 'A empresa valoriza as pessoas',                              escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Sinto orgulho de trabalhar na Mediall',                      escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'O ambiente de trabalho é respeitoso',                        escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'A empresa cuida do bem-estar dos colaboradores',             escala: 'likert5', obrigatoria: true, ordem: 4 },
      ],
    },
    {
      id: uuid(), titulo: 'Perguntas Abertas', ordem: 8,
      perguntas: [
        { id: uuid(), texto: 'O que a Mediall faz bem em relação às pessoas?',             escala: 'aberta', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'O que precisa melhorar no ambiente de trabalho?',            escala: 'aberta', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'O que seu líder poderia fazer melhor?',                      escala: 'aberta', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Cite uma situação positiva que você viveu na empresa',       escala: 'aberta', obrigatoria: true, ordem: 4 },
        { id: uuid(), texto: 'Cite uma situação que poderia ter sido melhor conduzida',    escala: 'aberta', obrigatoria: true, ordem: 5 },
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

  const existing = await repo.findOne({ where: { id: PESQUISA_ID_ORIGINAL } });
  if (existing) {
    console.log(`Pesquisa já existe com id ${PESQUISA_ID_ORIGINAL} — nada alterado.`);
    await ds.destroy();
    return;
  }

  // Insere com o ID original fixo via query raw para garantir o UUID exato
  await ds.query(`
    INSERT INTO pesquisas_corporativas
      (id, "tenantId", titulo, slug, tipo, blocos, ativa, periodo, categoria, visibility, "allowedTenantIds", "visivelParaUnidade", "criadoEm", "atualizadoEm")
    VALUES
      ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, NOW(), NOW())
  `, [
    PESQUISA_ID_ORIGINAL,
    TENANT_ID_GOIANIA,
    'Pesquisa de Clima e Soft Skills — Mediall 2026',
    SLUG,
    'clima',
    JSON.stringify(makeBlocos()),
    true,
    '2026-S1',
    'Clima Organizacional',
    'privada',
    null,
    false,
  ]);

  console.log(`✓ Pesquisa recriada com id original: ${PESQUISA_ID_ORIGINAL}`);
  console.log(`  slug: ${SLUG}`);
  console.log(`  tenantId: ${TENANT_ID_GOIANIA}`);
  console.log(`\nPróximo passo: restaurar as respostas via PITR do RDS e importar a tabela pesquisas_respostas.`);

  await ds.destroy();
}

if (require.main === module) {
  run().catch(e => { console.error(e); process.exit(1); });
}
