/**
 * Seed: creates Machadinho, UEI, UPA, and Porto Grande tenants
 * with their respective form templates (same questions as HGM).
 *
 * Run: npm run seed:other-tenants
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TenantEntity } from '../../modules/tenants/tenant.entity';
import { UserEntity } from '../../modules/user/user.entity';
import {
  FormTemplateEntity,
  FormTemplateBlockEntity,
  FormQuestionEntity,
} from '../../modules/form-templates/form-template.entity';

dotenv.config();

// ── Shared form template definitions (same as HGM) ───────────────────────────

const INTERNACAO = {
  slug: 'internacao',
  name: 'Internação Hospitalar',
  blocks: [
    {
      title: 'Bloco 1 – Satisfação do Paciente (Infraestrutura e ambiente da internação Hospitalar)',
      questions: [
        { questionKey: 'q1', text: 'Como você avalia o conforto do quarto de internação durante sua permanência?', scale: 'rating4' as const, subReasons: ['Temperatura inadequada (muito frio ou muito calor)', 'Cama ou colchão desconfortável', 'Barulho excessivo no quarto ou corredor'] as [string, string, string] },
        { questionKey: 'q2', text: 'Como você avalia a limpeza e higienização do quarto e do banheiro?', scale: 'rating4' as const, subReasons: ['Limpeza realizada com pouca frequência', 'Banheiro com higienização insatisfatória', 'Presença de odores desagradáveis no ambiente'] as [string, string, string] },
        { questionKey: 'q3', text: 'Como você avalia o nível de organização e conservação das instalações do setor de internação?', scale: 'rating4' as const, subReasons: ['Equipamentos ou mobiliário danificados', 'Ambiente desorganizado ou com itens fora do lugar', 'Instalações com aparência de desgaste ou falta de manutenção'] as [string, string, string] },
        { questionKey: 'q4', text: 'Como você avalia o nível de silêncio e tranquilidade do ambiente durante o período de internação?', scale: 'rating4' as const, subReasons: ['Barulho de outros pacientes ou acompanhantes', 'Ruído de equipamentos ou alarmes frequentes', 'Movimentação intensa da equipe durante o período noturno'] as [string, string, string] },
      ],
    },
    {
      title: 'Bloco 2 – Experiência do Paciente (Atendimento e cuidado assistencial na internação Hospitalar)',
      questions: [
        { questionKey: 'q5', text: 'Como você avalia o atendimento prestado pela equipe de enfermagem durante sua internação?', scale: 'rating4' as const, subReasons: ['Demora no atendimento ao chamado', 'Pouca atenção ou comunicação insuficiente', 'Falta de gentileza ou cordialidade'] as [string, string, string] },
        { questionKey: 'q6', text: 'Como você avalia o atendimento médico recebido ao longo da sua permanência no hospital?', scale: 'rating4' as const, subReasons: ['Médico passou pouco tempo durante as visitas', 'Explicações sobre o tratamento foram insuficientes', 'Dificuldade em obter respostas às dúvidas'] as [string, string, string] },
        { questionKey: 'q7', text: 'Como você avalia a atenção, orientação e disponibilidade da equipe assistencial durante sua internação?', scale: 'rating4' as const, subReasons: ['Equipe difícil de localizar quando necessário', 'Orientações sobre o tratamento foram incompletas ou confusas', 'Sensação de não ser ouvido ou levado a sério'] as [string, string, string] },
        { questionKey: 'q8', text: 'Como você avalia as orientações recebidas no momento da alta hospitalar?', scale: 'rating4' as const, subReasons: ['Instruções sobre medicamentos foram pouco claras', 'Não foram informados os cuidados necessários em casa', 'Documentação da alta entregue de forma incompleta'] as [string, string, string] },
      ],
    },
    {
      title: 'Recomendação',
      questions: [
        { questionKey: 'nps', text: 'Você recomendaria este serviço a um amigo ou familiar?', scale: 'nps' as const, subReasons: null },
      ],
    },
  ],
};

const EXAMES = {
  slug: 'exames',
  name: 'Exames Laboratoriais e de Imagem',
  blocks: [
    {
      title: 'Bloco 1 – Satisfação do Paciente (Infraestrutura e ambiente do setor de exames)',
      questions: [
        { questionKey: 'q1', text: 'Como você avalia as condições gerais das instalações do setor de exames?', scale: 'rating4' as const, subReasons: ['Ambiente com aparência de falta de manutenção', 'Espaço físico pequeno ou inadequado', 'Sinalização insuficiente para encontrar o setor'] as [string, string, string] },
        { questionKey: 'q2', text: 'Como você avalia a limpeza e higienização dos ambientes onde realizou os exames?', scale: 'rating4' as const, subReasons: ['Bancadas ou superfícies com aparência de sujidade', 'Limpeza realizada com pouca frequência', 'Presença de odores desagradáveis no ambiente'] as [string, string, string] },
        { questionKey: 'q3', text: 'Como você avalia o conforto do ambiente de espera e do local de realização dos exames?', scale: 'rating4' as const, subReasons: ['Assentos insuficientes ou desconfortáveis', 'Temperatura inadequada na sala de espera', 'Tempo de espera muito prolongado sem informação'] as [string, string, string] },
      ],
    },
    {
      title: 'Bloco 2 – Experiência do Paciente (Atendimento e jornada nos exames)',
      questions: [
        { questionKey: 'q4', text: 'Como você avalia a clareza das orientações recebidas sobre a preparação e a realização dos exames?', scale: 'rating4' as const, subReasons: ['Instruções de preparo foram confusas ou incompletas', 'Não fui informado com antecedência suficiente', 'Não houve explicação sobre o procedimento antes de realizá-lo'] as [string, string, string] },
        { questionKey: 'q5', text: 'Como você avalia o cuidado e a segurança transmitidos pela equipe durante a coleta ou realização dos exames?', scale: 'rating4' as const, subReasons: ['Equipe demonstrou pressa durante a coleta ou exame', 'Senti falta de cuidado com a minha privacidade', 'Procedimento gerou desconforto sem explicação prévia'] as [string, string, string] },
        { questionKey: 'q6', text: 'Como você avalia a sua experiência desde o agendamento até a realização dos exames?', scale: 'rating4' as const, subReasons: ['Dificuldade para agendar o exame', 'Tempo de espera no dia do exame foi excessivo', 'Falta de comunicação entre agendamento e atendimento'] as [string, string, string] },
      ],
    },
    {
      title: 'Recomendação',
      questions: [
        { questionKey: 'nps', text: 'Você recomendaria este serviço a um amigo ou familiar?', scale: 'nps' as const, subReasons: null },
      ],
    },
  ],
};

const AMBULATORIO = {
  slug: 'ambulatorio',
  name: 'Ambulatório',
  blocks: [
    {
      title: 'Bloco 1 – Satisfação do Paciente (Infraestrutura e ambiente do Ambulatório)',
      questions: [
        { questionKey: 'q1', text: 'Como você avalia as condições gerais das instalações como (ventilação, iluminação e temperatura) do Ambulatório?', scale: 'rating4' as const, subReasons: ['Temperatura do ambiente inadequada', 'Iluminação insuficiente nas áreas de atendimento', 'Ventilação precária ou ambiente abafado'] as [string, string, string] },
        { questionKey: 'q2', text: 'Como você avalia a limpeza e higienização dos ambientes do Ambulatório?', scale: 'rating4' as const, subReasons: ['Banheiros ou áreas comuns com higienização insatisfatória', 'Limpeza realizada com pouca frequência', 'Presença de resíduos ou odores desagradáveis'] as [string, string, string] },
        { questionKey: 'q3', text: 'Como você avalia o conforto da sala de espera do Ambulatório?', scale: 'rating4' as const, subReasons: ['Cadeiras insuficientes ou desconfortáveis', 'Tempo de espera excessivo sem informação', 'Falta de espaço ou ambiente muito cheio'] as [string, string, string] },
        { questionKey: 'q4', text: 'Como você avalia a organização e sinalização dos ambientes do Ambulatório?', scale: 'rating4' as const, subReasons: ['Dificuldade para encontrar consultórios ou setores', 'Filas desorganizadas ou sem ordem de chamada clara', 'Sinalização insuficiente ou confusa nos corredores'] as [string, string, string] },
      ],
    },
    {
      title: 'Bloco 2 – Experiência do Paciente (Atendimento e cuidado assistencial no Ambulatório)',
      questions: [
        { questionKey: 'q5', text: 'Como você avalia o atendimento prestado pela equipe de enfermagem no Ambulatório?', scale: 'rating4' as const, subReasons: ['Demora no atendimento ou nos procedimentos', 'Comunicação insuficiente durante o atendimento', 'Falta de cordialidade ou atenção individualizada'] as [string, string, string] },
        { questionKey: 'q6', text: 'Como você avalia o atendimento médico recebido no Ambulatório?', scale: 'rating4' as const, subReasons: ['Consulta muito curta ou superficial', 'Diagnóstico ou tratamento explicado de forma incompleta', 'Dificuldade em esclarecer dúvidas durante a consulta'] as [string, string, string] },
        { questionKey: 'q7', text: 'Como você avalia a atenção, disponibilidade, informações e orientações da equipe assistencial durante seu atendimento no Ambulatório?', scale: 'rating4' as const, subReasons: ['Equipe com pouca disponibilidade para orientar', 'Informações fornecidas de forma inconsistente por diferentes profissionais', 'Sensação de não ter recebido atenção individualizada'] as [string, string, string] },
        { questionKey: 'q8', text: 'Como você avalia as orientações recebidas ao final do atendimento ambulatorial?', scale: 'rating4' as const, subReasons: ['Prescrição ou receita entregue sem explicação adequada', 'Não foram informados os próximos passos do tratamento', 'Orientações sobre retorno ou encaminhamento foram pouco claras'] as [string, string, string] },
      ],
    },
    {
      title: 'Recomendação',
      questions: [
        { questionKey: 'nps', text: 'Você recomendaria este serviço a um amigo ou familiar?', scale: 'nps' as const, subReasons: null },
      ],
    },
  ],
};

const UTI = {
  slug: 'uti',
  name: 'UTI',
  blocks: [
    {
      title: 'Bloco 1 – Satisfação do Paciente (Infraestrutura e ambiente da UTI)',
      questions: [
        { questionKey: 'q1', text: 'Como você avalia as condições gerais das instalações da UTI?', scale: 'rating4' as const, subReasons: ['Ambiente com aparência de falta de manutenção', 'Espaço físico percebido como inadequado ou apertado', 'Equipamentos com aparência de desgaste ou obsolescência'] as [string, string, string] },
        { questionKey: 'q2', text: 'Como você avalia a limpeza e organização do ambiente da UTI?', scale: 'rating4' as const, subReasons: ['Ambiente com aparência de sujidade ou desorganização', 'Limpeza realizada com pouca frequência', 'Presença de odores desagradáveis na unidade'] as [string, string, string] },
        { questionKey: 'q3', text: 'Como você avalia o nível de conforto do ambiente da UTI, considerando ruídos, iluminação e temperatura?', scale: 'rating4' as const, subReasons: ['Alarmes frequentes perturbaram o repouso do paciente', 'Temperatura inadequada no ambiente da UTI', 'Iluminação constante dificultou o descanso'] as [string, string, string] },
      ],
    },
    {
      title: 'Bloco 2 – Experiência do Paciente (Atendimento e comunicação assistencial na UTI)',
      questions: [
        { questionKey: 'q4', text: 'Como você avalia o atendimento prestado pela equipe de enfermagem na UTI?', scale: 'rating4' as const, subReasons: ['Demora no atendimento às solicitações', 'Comunicação insuficiente com a família sobre o estado do paciente', 'Falta de cordialidade ou empatia durante os cuidados'] as [string, string, string] },
        { questionKey: 'q5', text: 'Como você avalia o atendimento prestado pela equipe médica na UTI?', scale: 'rating4' as const, subReasons: ['Visitas médicas muito rápidas ou superficiais', 'Informações sobre o quadro clínico foram insuficientes ou confusas', 'Dificuldade de contato com o médico responsável'] as [string, string, string] },
        { questionKey: 'q6', text: 'Como você avalia a disponibilidade da equipe para esclarecer dúvidas e orientações à família ou ao paciente durante a permanência na UTI?', scale: 'rating4' as const, subReasons: ['Equipe com pouca disponibilidade para atender a família', 'Informações sobre o tratamento foram contraditórias', 'Perguntas ficaram sem resposta ou foram respondidas superficialmente'] as [string, string, string] },
      ],
    },
    {
      title: 'Recomendação',
      questions: [
        { questionKey: 'nps', text: 'Você recomendaria este hospital a um amigo ou familiar?', scale: 'nps' as const, subReasons: null },
      ],
    },
  ],
};

const PRONTO_SOCORRO = {
  slug: 'pronto-socorro',
  name: 'Pronto Socorro',
  blocks: [
    {
      title: 'Bloco 1 – Satisfação do Paciente (Infraestrutura e ambiente do Pronto Socorro)',
      questions: [
        { questionKey: 'q1', text: 'Como você avalia as condições gerais das instalações do Pronto Socorro?', scale: 'rating4' as const, subReasons: ['Ambiente superlotado ou com espaço físico insuficiente', 'Instalações com aparência de falta de manutenção', 'Ausência de estrutura adequada para pacientes em espera'] as [string, string, string] },
        { questionKey: 'q2', text: 'Como você avalia a limpeza e higienização do Pronto Socorro?', scale: 'rating4' as const, subReasons: ['Banheiros com higienização insatisfatória', 'Limpeza do ambiente realizada com pouca frequência', 'Presença de resíduos ou odores desagradáveis'] as [string, string, string] },
        { questionKey: 'q3', text: 'Como você avalia o conforto da sala de espera do Pronto Socorro?', scale: 'rating4' as const, subReasons: ['Cadeiras insuficientes para o volume de pacientes', 'Temperatura inadequada no ambiente de espera', 'Tempo de espera muito longo sem informação'] as [string, string, string] },
        { questionKey: 'q4', text: 'Como você avalia a organização e sinalização dos ambientes do Pronto Socorro?', scale: 'rating4' as const, subReasons: ['Dificuldade para entender o fluxo de atendimento', 'Filas ou triagem desorganizadas', 'Sinalização insuficiente para orientar pacientes'] as [string, string, string] },
      ],
    },
    {
      title: 'Bloco 2 – Experiência do Paciente (Atendimento e cuidado assistencial no Pronto Socorro)',
      questions: [
        { questionKey: 'q5', text: 'Como você avalia o atendimento prestado pela equipe de enfermagem no Pronto Socorro?', scale: 'rating4' as const, subReasons: ['Demora no atendimento após chamado ou solicitação', 'Pouca atenção ou comunicação durante o cuidado', 'Falta de gentileza em momento de vulnerabilidade'] as [string, string, string] },
        { questionKey: 'q6', text: 'Como você avalia o atendimento médico recebido no Pronto Socorro?', scale: 'rating4' as const, subReasons: ['Tempo de espera pelo atendimento médico foi excessivo', 'Consulta muito rápida sem atenção adequada ao caso', 'Diagnóstico ou condutas não foram explicados de forma clara'] as [string, string, string] },
        { questionKey: 'q7', text: 'Como você avalia o cuidado, orientação e informações recebidos de forma geral durante seu atendimento no Pronto Socorro?', scale: 'rating4' as const, subReasons: ['Informações sobre o tratamento foram insuficientes ou confusas', 'Não fui orientado sobre os próximos passos após o atendimento', 'Sensação de não ter sido tratado com prioridade adequada'] as [string, string, string] },
      ],
    },
    {
      title: 'Recomendação',
      questions: [
        { questionKey: 'nps', text: 'Você recomendaria este serviço a um amigo ou familiar?', scale: 'nps' as const, subReasons: null },
      ],
    },
  ],
};

const CENTRO_CIRURGICO = {
  slug: 'centro-cirurgico',
  name: 'Centro Cirúrgico',
  blocks: [
    {
      title: 'Bloco 1 – Satisfação do Paciente (Infraestrutura e ambiente do Centro Cirúrgico)',
      questions: [
        { questionKey: 'q1', text: 'Como você avalia as condições gerais das instalações do Centro Cirúrgico?', scale: 'rating4' as const, subReasons: ['Instalações com aparência de falta de manutenção ou desgaste', 'Ambiente percebido como pouco organizado', 'Temperatura inadequada nas áreas do centro cirúrgico'] as [string, string, string] },
        { questionKey: 'q2', text: 'Como você avalia a limpeza e organização dos ambientes do Centro Cirúrgico?', scale: 'rating4' as const, subReasons: ['Ambiente com aparência de higienização insatisfatória', 'Presença de materiais ou equipamentos fora do lugar', 'Limpeza das áreas de circulação realizada com pouca frequência'] as [string, string, string] },
        { questionKey: 'q3', text: 'Como você avalia o conforto e a organização das áreas de preparo e recuperação?', scale: 'rating4' as const, subReasons: ['Maca ou cama de recuperação desconfortável', 'Temperatura inadequada na sala de recuperação', 'Tempo de espera no pré-operatório foi excessivo sem informação'] as [string, string, string] },
      ],
    },
    {
      title: 'Bloco 2 – Experiência do Paciente (Atendimento e processo assistencial cirúrgico)',
      questions: [
        { questionKey: 'q4', text: 'Como você avalia o atendimento prestado pela equipe de enfermagem no período cirúrgico?', scale: 'rating4' as const, subReasons: ['Pouca explicação sobre os procedimentos realizados no pré ou pós-operatório', 'Demora no atendimento às necessidades durante a recuperação', 'Falta de empatia ou acolhimento em momento de ansiedade'] as [string, string, string] },
        { questionKey: 'q5', text: 'Como você avalia o atendimento prestado pela equipe médica relacionado ao procedimento cirúrgico?', scale: 'rating4' as const, subReasons: ['Explicação pré-operatória sobre o procedimento foi insuficiente', 'Pouca presença do médico no pós-operatório imediato', 'Dificuldade em obter respostas às dúvidas sobre o procedimento'] as [string, string, string] },
        { questionKey: 'q6', text: 'Como você avalia a clareza das orientações recebidas antes e após o procedimento cirúrgico?', scale: 'rating4' as const, subReasons: ['Instruções pré-operatórias foram confusas ou entregues com pouca antecedência', 'Orientações de cuidados pós-cirúrgicos foram insuficientes', 'Não foram informados os sinais de alerta que demandam retorno ao hospital'] as [string, string, string] },
      ],
    },
    {
      title: 'Recomendação',
      questions: [
        { questionKey: 'nps', text: 'Você recomendaria este serviço a um amigo ou familiar?', scale: 'nps' as const, subReasons: null },
      ],
    },
  ],
};

// ── Tenant definitions ────────────────────────────────────────────────────────

const OTHER_TENANTS = [
  {
    slug: 'hmmdo',
    name: "Hospital Municipal de Machadinho D'Oeste",
    adminEmail: 'admin@hmmdo.com',
    templates: [AMBULATORIO, PRONTO_SOCORRO, INTERNACAO, CENTRO_CIRURGICO],
  },
  {
    slug: 'uei',
    name: 'UEI — Unidade de Emergência Integrada',
    adminEmail: 'admin@uei.com',
    templates: [EXAMES, INTERNACAO, UTI],
  },
  {
    slug: 'upa',
    name: 'UPA',
    adminEmail: 'admin@upa.com',
    templates: [EXAMES],
  },
  {
    slug: 'hrpg',
    name: 'Hospital Regional de Porto Grande',
    adminEmail: 'admin@hrpg.com',
    templates: [AMBULATORIO, PRONTO_SOCORRO, INTERNACAO, CENTRO_CIRURGICO],
  },
];

// ── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432');
  const dbUser = process.env.DB_USERNAME || 'postgres';
  const dbPass = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_DATABASE || 'feedbackforms';
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false;

  const ds = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPass,
    database: dbName,
    entities: [TenantEntity, UserEntity, FormTemplateEntity, FormTemplateBlockEntity, FormQuestionEntity],
    synchronize: true,
    ssl,
  });
  await ds.initialize();
  console.log(`Connected to ${dbName}`);

  const tenantRepo = ds.getRepository(TenantEntity);
  const userRepo = ds.getRepository(UserEntity);
  const templateRepo = ds.getRepository(FormTemplateEntity);
  const blockRepo = ds.getRepository(FormTemplateBlockEntity);
  const questionRepo = ds.getRepository(FormQuestionEntity);

  const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const hashed = await bcrypt.hash(defaultPassword, 10);

  for (const tenantDef of OTHER_TENANTS) {
    console.log(`\n── ${tenantDef.name} ──`);

    // 1. Create tenant
    let tenant = await tenantRepo.findOne({ where: { slug: tenantDef.slug } });
    if (!tenant) {
      tenant = await tenantRepo.save(tenantRepo.create({ slug: tenantDef.slug, name: tenantDef.name, hasFeedbackForms: true }));
      console.log(`  Tenant created: ${tenant.name}`);
    } else {
      if (!tenant.hasFeedbackForms) {
        await tenantRepo.update(tenant.id, { hasFeedbackForms: true });
        console.log(`  Tenant updated hasFeedbackForms=true: ${tenant.name}`);
      } else {
        console.log(`  Tenant already exists: ${tenant.name}`);
      }
    }

    // 2. Create admin user
    const existingAdmin = await userRepo.findOne({ where: { email: tenantDef.adminEmail } });
    if (!existingAdmin) {
      await userRepo.save(
        userRepo.create({
          email: tenantDef.adminEmail,
          name: 'Administrador',
          password: hashed,
          role: 'hospital_admin',
          tenantId: tenant.id,
        }),
      );
      console.log(`  Admin created: ${tenantDef.adminEmail}`);
    } else {
      console.log(`  Admin already exists: ${tenantDef.adminEmail}`);
    }

    // 3. Seed form templates
    for (const tmpl of tenantDef.templates) {
      const existing = await templateRepo.findOne({ where: { tenantId: tenant.id, slug: tmpl.slug } });
      if (existing) {
        console.log(`  Template already exists: ${tmpl.slug}`);
        continue;
      }

      const template = await templateRepo.save(
        templateRepo.create({ tenantId: tenant.id, slug: tmpl.slug, name: tmpl.name }),
      );

      for (let bi = 0; bi < tmpl.blocks.length; bi++) {
        const b = tmpl.blocks[bi];
        const block = await blockRepo.save(
          blockRepo.create({ templateId: template.id, title: b.title, order: bi }),
        );
        for (let qi = 0; qi < b.questions.length; qi++) {
          const q = b.questions[qi];
          await questionRepo.save(
            questionRepo.create({
              blockId: block.id,
              questionKey: q.questionKey,
              text: q.text,
              scale: q.scale,
              subReasons: q.subReasons,
              order: qi,
            }),
          );
        }
      }
      console.log(`  Template seeded: ${tmpl.name}`);
    }
  }

  await ds.destroy();
  console.log('\nSeed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
