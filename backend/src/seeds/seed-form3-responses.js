const { Client } = require('pg');
require('dotenv').config();

const c = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'feedbackforms',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
});

const sectors = [
  {
    formType: 'ambulatorio',
    weakReasons: ['Cadeiras insuficientes ou desconfortáveis', 'Tempo de espera excessivo sem informação'],
    responses: [
      { name: 'Ana Lima',       cpf: '11111111111', scores: { q1:4,q2:4,q3:1,q4:3,q5:4,q6:4,q7:3,q8:4 }, nps: 0, note: 'Esperei mais de 2 horas sem nenhuma informacao sobre o atendimento.' },
      { name: 'Carlos Souza',   cpf: '11122233344', scores: { q1:3,q2:4,q3:2,q4:3,q5:3,q6:3,q7:4,q8:3 }, nps: 1 },
      { name: 'Fernanda Costa', cpf: '22233344455', scores: { q1:4,q2:3,q3:2,q4:4,q5:4,q6:4,q7:4,q8:4 }, nps: 1 },
      { name: 'Joao Alves',     cpf: '33344455566', scores: { q1:3,q2:3,q3:4,q4:3,q5:3,q6:3,q7:3,q8:3 }, nps: 1 },
    ],
  },
  {
    formType: 'internacao',
    weakReasons: ['Demora no atendimento ou nos procedimentos', 'Comunicacao insuficiente durante o atendimento'],
    responses: [
      { name: 'Maria Oliveira', cpf: '44455566677', scores: { q1:4,q2:4,q3:3,q4:4,q5:1,q6:3,q7:3,q8:4 }, nps: 0, note: 'A equipe demorou muito para responder ao chamado e nao explicou o procedimento.' },
      { name: 'Paulo Mendes',   cpf: '55566677788', scores: { q1:3,q2:4,q3:4,q4:3,q5:2,q6:3,q7:3,q8:3 }, nps: 1 },
      { name: 'Lucia Ferreira', cpf: '66677788899', scores: { q1:4,q2:3,q3:3,q4:4,q5:4,q6:4,q7:4,q8:4 }, nps: 1 },
      { name: 'Roberto Nunes',  cpf: '77788899900', scores: { q1:3,q2:3,q3:4,q4:3,q5:2,q6:3,q7:3,q8:3 }, nps: 0, note: 'A equipe demorou muito para responder ao chamado e nao explicou o procedimento.' },
    ],
  },
  {
    formType: 'exames',
    weakReasons: ['Dificuldade para encontrar consultorios ou setores', 'Sinalizacao insuficiente ou confusa nos corredores'],
    responses: [
      { name: 'Sandra Rocha',   cpf: '88899900011', scores: { q1:4,q2:4,q3:3,q4:1,q5:4,q6:4,q7:3,q8:4 }, nps: 0, note: 'Nao consegui encontrar o setor de exames, a sinalizacao e muito confusa.' },
      { name: 'Marcos Dias',    cpf: '99900011122', scores: { q1:3,q2:3,q3:3,q4:2,q5:3,q6:3,q7:3,q8:3 }, nps: 1 },
      { name: 'Beatriz Pinto',  cpf: '00011122233', scores: { q1:4,q2:4,q3:4,q4:4,q5:4,q6:4,q7:4,q8:4 }, nps: 1 },
    ],
  },
  {
    formType: 'uti',
    weakReasons: ['Equipe com pouca disponibilidade para orientar', 'Informacoes fornecidas de forma inconsistente por diferentes profissionais'],
    responses: [
      { name: 'Tereza Santos',  cpf: '11133355577', scores: { q1:4,q2:4,q3:4,q4:4,q5:4,q6:4,q7:1,q8:3 }, nps: 0, note: 'Cada medico dizia uma coisa diferente para a familia. Faltou comunicacao.' },
      { name: 'Eduardo Lima',   cpf: '22244466688', scores: { q1:3,q2:4,q3:3,q4:4,q5:4,q6:4,q7:2,q8:4 }, nps: 1 },
      { name: 'Claudia Melo',   cpf: '33355577799', scores: { q1:4,q2:3,q3:4,q4:3,q5:3,q6:4,q7:1,q8:3 }, nps: 0, note: 'Cada medico dizia uma coisa diferente para a familia. Faltou comunicacao.' },
      { name: 'Diego Barros',   cpf: '44466688800', scores: { q1:4,q2:4,q3:4,q4:4,q5:4,q6:4,q7:4,q8:4 }, nps: 1 },
    ],
  },
  {
    formType: 'pronto-socorro',
    weakReasons: ['Tempo de espera excessivo sem informacao', 'Falta de espaco ou ambiente muito cheio'],
    responses: [
      { name: 'Patricia Cruz',   cpf: '55577799911', scores: { q1:2,q2:3,q3:1,q4:3,q5:3,q6:3,q7:3,q8:3 }, nps: 0, note: 'Fiquei horas aguardando sem receber nenhuma atualizacao sobre minha situacao.' },
      { name: 'Renato Vieira',   cpf: '66688800022', scores: { q1:3,q2:3,q3:2,q4:3,q5:3,q6:3,q7:3,q8:3 }, nps: 1 },
      { name: 'Simone Teixeira', cpf: '77799911133', scores: { q1:4,q2:4,q3:4,q4:4,q5:4,q6:4,q7:4,q8:4 }, nps: 1 },
    ],
  },
  {
    formType: 'hemodialise',
    weakReasons: ['Consulta muito curta ou superficial', 'Diagnostico ou tratamento explicado de forma incompleta'],
    responses: [
      { name: 'Gilberto Moura',  cpf: '88800022244', scores: { q1:4,q2:4,q3:4,q4:4,q5:4,q6:1,q7:3,q8:3 }, nps: 0, note: 'O procedimento foi feito com pressa e ninguem explicou o que estava acontecendo.' },
      { name: 'Ivone Cardoso',   cpf: '99911133355', scores: { q1:3,q2:4,q3:3,q4:3,q5:4,q6:2,q7:3,q8:3 }, nps: 1 },
      { name: 'Leandro Fonseca', cpf: '00022244466', scores: { q1:4,q2:4,q3:4,q4:4,q5:4,q6:4,q7:4,q8:4 }, nps: 1 },
    ],
  },
  {
    formType: 'centro-cirurgico',
    weakReasons: ['Prescricao ou receita entregue sem explicacao adequada', 'Nao foram informados os proximos passos do tratamento'],
    responses: [
      { name: 'Natalia Gomes',  cpf: '11144477700', scores: { q1:4,q2:4,q3:4,q4:4,q5:4,q6:4,q7:4,q8:1 }, nps: 0, note: 'Recebi a receita mas ninguem explicou como tomar os medicamentos ou quando retornar.' },
      { name: 'Flavio Ribeiro', cpf: '22255588811', scores: { q1:4,q2:3,q3:4,q4:4,q5:4,q6:4,q7:4,q8:2 }, nps: 1 },
      { name: 'Adriana Campos', cpf: '33366699922', scores: { q1:3,q2:4,q3:3,q4:3,q5:3,q6:3,q7:4,q8:4 }, nps: 1 },
      { name: 'Henrique Ramos', cpf: '44477700033', scores: { q1:4,q2:4,q3:4,q4:4,q5:4,q6:4,q7:3,q8:1 }, nps: 0, note: 'Recebi a receita mas ninguem explicou como tomar os medicamentos ou quando retornar.' },
    ],
  },
];

async function run() {
  await c.connect();

  const tenantRes = await c.query("SELECT id FROM tenants WHERE slug = 'hgm' LIMIT 1");
  const TENANT_ID = tenantRes.rows[0]?.id;
  if (!TENANT_ID) { console.error('Tenant hgm not found'); await c.end(); return; }
  console.log('Tenant ID:', TENANT_ID);

  let total = 0;
  for (const sector of sectors) {
    for (const resp of sector.responses) {
      const answers = Object.entries(resp.scores).map(([questionId, value]) => {
        const entry = { questionId, value };
        if (value <= 2) {
          entry.reasons = sector.weakReasons;
          if (resp.note) entry.note = resp.note;
        }
        return entry;
      });

      if (resp.nps === 0) {
        answers.push({ questionId: 'nps', value: 0, note: resp.note || '' });
      } else {
        answers.push({ questionId: 'nps', value: 1 });
      }

      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date(Date.now() - daysAgo * 86400000);

      await c.query(
        'INSERT INTO form3_responses ("tenantId", "formType", "patientName", "patientCpf", "patientAge", "patientGender", "admissionDate", "dischargeDate", "evaluatedDepartment", answers, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
        [TENANT_ID, sector.formType, resp.name, resp.cpf, 45, 'F', createdAt, createdAt, sector.formType, JSON.stringify(answers), createdAt]
      );
      total++;
    }
  }

  console.log('Inserted', total, 'responses successfully');
  await c.end();
}

run().catch(e => { console.error(e.message); c.end(); });
