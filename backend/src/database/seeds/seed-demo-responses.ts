/**
 * Seed: inserts demo form responses for the HGM tenant.
 * Run: npx ts-node -r tsconfig-paths/register src/database/seeds/seed-demo-responses.ts
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../../modules/tenants/tenant.entity';
import { UserEntity } from '../../modules/user/user.entity';
import {
  FormTemplateEntity,
  FormTemplateBlockEntity,
  FormQuestionEntity,
} from '../../modules/form-templates/form-template.entity';
import { Form3ResponseEntity } from '../../modules/forms/forms.entity';

dotenv.config();

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [TenantEntity, UserEntity, FormTemplateEntity, FormTemplateBlockEntity, FormQuestionEntity, Form3ResponseEntity],
  synchronize: false,
});

const NAMES = [
  'Maria das Graças Silva', 'João Paulo Oliveira', 'Ana Beatriz Costa',
  'Carlos Eduardo Souza', 'Fernanda Lima', 'Roberto Alves Pereira',
  'Luciana Fernandes', 'Pedro Henrique Rocha', 'Adriana Moraes',
  'Marcos Antônio Santos', 'Juliana Carvalho', 'Felipe Gomes Martins',
  'Rosana Borges', 'André Luiz Tavares', 'Camila Rodrigues',
  'Sérgio Nascimento', 'Patrícia Vieira', 'Leandro Barbosa',
  'Simone Cunha', 'Rafael Mendes Araújo',
];

const GENDERS = ['Masculino', 'Feminino'];

function randomCpf(): string {
  return Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
}

function randomAge(): number {
  return Math.floor(Math.random() * 60) + 18;
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function randomGender(): string {
  return GENDERS[Math.floor(Math.random() * GENDERS.length)];
}

function randomName(): string {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

/** 1=Ruim, 2=Regular, 3=Bom, 4=Excelente — weighted toward positive */
function randomRating4(): number {
  const r = Math.random();
  if (r < 0.10) return 1; // 10% Ruim
  if (r < 0.25) return 2; // 15% Regular
  if (r < 0.65) return 3; // 40% Bom
  return 4;               // 35% Excelente
}

/** NPS 0-10 — weighted toward promoters */
function randomNps(): number {
  const r = Math.random();
  if (r < 0.10) return Math.floor(Math.random() * 7);      // 10% detratores (0-6)
  if (r < 0.20) return 7 + Math.floor(Math.random() * 2);  // 10% neutros (7-8)
  return 9 + Math.floor(Math.random() * 2);                 // 80% promotores (9-10)
}

const SUB_REASONS: Record<string, [string, string, string]> = {
  q1: ['Temperatura inadequada (muito frio ou muito calor)', 'Cama ou colchão desconfortável', 'Barulho excessivo no quarto ou corredor'],
  q2: ['Limpeza realizada com pouca frequência', 'Banheiro com higienização insatisfatória', 'Presença de odores desagradáveis no ambiente'],
  q3: ['Equipamentos ou mobiliário danificados', 'Ambiente desorganizado ou com itens fora do lugar', 'Instalações com aparência de desgaste ou falta de manutenção'],
  q4: ['Barulho de outros pacientes ou acompanhantes', 'Ruído de equipamentos ou alarmes frequentes', 'Movimentação intensa da equipe durante o período noturno'],
  q5: ['Demora no atendimento ao chamado', 'Pouca atenção ou comunicação insuficiente', 'Falta de gentileza ou cordialidade'],
  q6: ['Médico passou pouco tempo durante as visitas', 'Explicações sobre o tratamento foram insuficientes', 'Dificuldade em obter respostas às dúvidas'],
  q7: ['Equipe difícil de localizar quando necessário', 'Orientações sobre o tratamento foram incompletas ou confusas', 'Sensação de não ser ouvido ou levado a sério'],
  q8: ['Instruções sobre medicamentos foram pouco claras', 'Não foram informados os cuidados necessários em casa', 'Documentação da alta entregue de forma incompleta'],
};

const POSITIVE_COMMENTS = [
  'Fui muito bem atendido, equipe prestativa e atenciosa.',
  'Excelente atendimento, me senti seguro durante toda a internação.',
  'Os profissionais foram muito gentis e competentes.',
  'Estou muito satisfeito com o serviço prestado pelo hospital.',
  'Atendimento rápido e eficiente, recomendo a todos.',
  '',
  '',
  '',
];

const NEGATIVE_COMMENTS = [
  'Aguardei muito tempo para ser atendido, o processo poderia ser mais ágil.',
  'A comunicação entre a equipe e o paciente precisa melhorar.',
  'O ambiente estava barulhento durante a noite, dificultando o descanso.',
  'Faltaram informações claras sobre os procedimentos realizados.',
];

function randomComment(hasNegative: boolean): string {
  if (hasNegative) {
    return NEGATIVE_COMMENTS[Math.floor(Math.random() * NEGATIVE_COMMENTS.length)];
  }
  return POSITIVE_COMMENTS[Math.floor(Math.random() * POSITIVE_COMMENTS.length)];
}

/** Build answers for a form with given question keys (q1..qN + nps) */
function buildAnswers(questionKeys: string[]): { answers: { questionId: string; value: number; reasons?: string[]; note?: string }[]; hasNegative: boolean } {
  let hasNegative = false;
  const answers = questionKeys.map((key) => {
    if (key === 'nps') {
      const value = randomNps();
      return { questionId: 'nps', value };
    }
    const value = randomRating4();
    if (value <= 2) {
      hasNegative = true;
      const reasons = SUB_REASONS[key] ?? [];
      // pick 1 or 2 reasons randomly
      const picked = reasons
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.random() > 0.5 ? 2 : 1);
      return { questionId: key, value, reasons: picked };
    }
    return { questionId: key, value };
  });
  return { answers, hasNegative };
}

const FORM_CONFIGS: Record<string, { keys: string[]; department: string }> = {
  internacao:       { keys: ['q1','q2','q3','q4','q5','q6','q7','q8','nps'], department: 'Internação Hospitalar' },
  exames:           { keys: ['q1','q2','q3','q4','q5','q6','nps'],           department: 'Exames Laboratoriais e de Imagem' },
  ambulatorio:      { keys: ['q1','q2','q3','q4','q5','q6','q7','q8','nps'], department: 'Ambulatório' },
  uti:              { keys: ['q1','q2','q3','q4','q5','q6','nps'],           department: 'UTI' },
  'pronto-socorro': { keys: ['q1','q2','q3','q4','q5','q6','q7','nps'],      department: 'Pronto Socorro' },
  hemodialise:      { keys: ['q1','q2','q3','q4','q5','q6','nps'],           department: 'Hemodiálise' },
  'centro-cirurgico': { keys: ['q1','q2','q3','q4','q5','q6','nps'],         department: 'Centro Cirúrgico' },
};

async function main() {
  await ds.initialize();
  console.log('Connected to', process.env.DB_DATABASE);

  const tenantRepo = ds.getRepository(TenantEntity);
  const responseRepo = ds.getRepository(Form3ResponseEntity);

  const tenant = await tenantRepo.findOneByOrFail({ slug: 'hgm' });
  console.log('Tenant:', tenant.name);

  let total = 0;

  for (const [formType, config] of Object.entries(FORM_CONFIGS)) {
    const count = 15 + Math.floor(Math.random() * 6); // 15-20 per form
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const admission = daysAgo + 3 + Math.floor(Math.random() * 5);
      const { answers, hasNegative } = buildAnswers(config.keys);

      const response = responseRepo.create({
        tenantId: tenant.id,
        formType,
        patientName: randomName(),
        patientCpf: randomCpf(),
        patientAge: randomAge(),
        patientGender: randomGender(),
        admissionDate: randomDate(admission),
        dischargeDate: randomDate(daysAgo),
        evaluatedDepartment: config.department,
        answers,
        comments: randomComment(hasNegative),
      });

      await responseRepo.save(response);
      total++;
    }
    console.log(`  ${formType}: ${count} respostas inseridas`);
  }

  console.log(`\nSeed completo: ${total} respostas criadas.`);
  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
