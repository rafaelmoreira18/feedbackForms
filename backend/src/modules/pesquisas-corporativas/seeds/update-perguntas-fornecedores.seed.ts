import { v4 as uuid } from 'uuid';
import { PesquisaBloco } from '../entities/pesquisa-corporativa.entity';

/**
 * Atualiza os blocos/perguntas de todas as pesquisas de fornecedores já existentes.
 * Não cria nem remove pesquisas — apenas substitui a coluna `blocos`.
 *
 * Execução: npx ts-node src/modules/pesquisas-corporativas/seeds/update-perguntas-fornecedores.seed.ts
 */

function makeBlocos(): PesquisaBloco[] {
  return [
    {
      id: uuid(),
      titulo: '1. Comunicação e relacionamento',
      ordem: 1,
      perguntas: [
        { id: uuid(), texto: 'Clareza e transparência nas informações repassadas pela organização', escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Facilidade de contato; Retorno às solicitações, dúvidas ou pendências', escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Cordialidade no relacionamento com a equipe',                          escala: 'likert5', obrigatoria: true, ordem: 3 },
      ],
    },
    {
      id: uuid(),
      titulo: '2. Processo de contratação e negociação',
      ordem: 2,
      perguntas: [
        { id: uuid(), texto: 'Clareza das condições comerciais acordadas',  escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Cumprimento das condições negociadas',         escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Facilidade para tratativas comerciais',        escala: 'likert5', obrigatoria: true, ordem: 3 },
      ],
    },
    {
      id: uuid(),
      titulo: '3. Recebimento de produtos e/ou serviços',
      ordem: 3,
      perguntas: [
        { id: uuid(), texto: 'Clareza das especificações técnicas solicitadas',                              escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Planejamento e disponibilidade da equipe para alinhamentos técnicos',          escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Condições para entrega de produtos ou execução de serviços',                   escala: 'likert5', obrigatoria: true, ordem: 3 },
        { id: uuid(), texto: 'Tratamento dado a eventuais não conformidades',                                escala: 'likert5', obrigatoria: true, ordem: 4 },
      ],
    },
    {
      id: uuid(),
      titulo: '4. Pagamento e aspectos administrativos',
      ordem: 4,
      perguntas: [
        { id: uuid(), texto: 'Clareza quanto ao fluxo de emissão de notas fiscais e documentos administrativos', escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Cumprimento dos prazos de pagamento acordados',                                     escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Facilidade de contato com o setor financeiro/resolução de pendências',              escala: 'likert5', obrigatoria: true, ordem: 3 },
      ],
    },
    {
      id: uuid(),
      titulo: '5. Imagem institucional e parceria',
      ordem: 5,
      perguntas: [
        { id: uuid(), texto: 'Confiança e percepção da Organização como parceira estratégica',            escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Ética, transparência e respeito no relacionamento e acordos estabelecidos', escala: 'likert5', obrigatoria: true, ordem: 2 },
        { id: uuid(), texto: 'Interesse em manter ou ampliar a relação comercial',                       escala: 'likert5', obrigatoria: true, ordem: 3 },
      ],
    },
    {
      id: uuid(),
      titulo: '6. Avaliação geral',
      ordem: 6,
      perguntas: [
        { id: uuid(), texto: 'De forma geral, qual seu nível de satisfação com a Organização?',            escala: 'likert5', obrigatoria: true, ordem: 1 },
        { id: uuid(), texto: 'Você recomendaria nossa Organização para outros fornecedores ou parceiros?', escala: 'opcoes', opcoes: ['Sim', 'Não', 'Talvez'], obrigatoria: true, ordem: 2 },
      ],
    },
    {
      id: uuid(),
      titulo: '7. Questões abertas',
      ordem: 7,
      perguntas: [
        { id: uuid(), texto: 'Quais pontos positivos você identifica no relacionamento com a Organização?',           escala: 'aberta', obrigatoria: true,  ordem: 1 },
        { id: uuid(), texto: 'Quais oportunidades de melhoria você sugere?',                                          escala: 'aberta', obrigatoria: true,  ordem: 2 },
        { id: uuid(), texto: 'Houve alguma situação que dificultou a prestação do serviço ou fornecimento do produto?', escala: 'aberta', obrigatoria: true,  ordem: 3 },
        { id: uuid(), texto: 'Comentários adicionais',                                                                escala: 'aberta', obrigatoria: false, ordem: 4 },
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

  const pesquisas = await repo.find({ where: { tipo: 'fornecedores' } });
  console.log(`\nPesquisas de fornecedores encontradas: ${pesquisas.length}`);

  for (const p of pesquisas) {
    p.blocos = makeBlocos();
    await repo.save(p);
    console.log(`  ✓ Atualizada: ${p.slug}`);
  }

  console.log(`\nConcluído: ${pesquisas.length} pesquisa(s) atualizada(s).`);
  await ds.destroy();
}

if (require.main === module) {
  run().catch(e => { console.error(e); process.exit(1); });
}
