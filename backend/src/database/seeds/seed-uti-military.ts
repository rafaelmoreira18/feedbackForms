/**
 * Seed: creates UTI form templates for military UTI tenants.
 * Applies to: uti-tefe, uti-tabatinga, uti-humaita (NOT uti-hmab).
 *
 * Run: npm run seed:uti-military
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { TenantEntity } from '../../modules/tenants/tenant.entity';
import {
  FormTemplateEntity,
  FormTemplateBlockEntity,
  FormQuestionEntity,
} from '../../modules/form-templates/form-template.entity';

dotenv.config();

const UTI_TENANTS = ['uti-tefe', 'uti-tabatinga', 'uti-humaita'];

const UTI_TEMPLATE = {
  slug: 'uti',
  name: 'UTI',
  blocks: [
    {
      title: 'Bloco 1 – Satisfação do Paciente (Infraestrutura e ambiente da UTI)',
      questions: [
        {
          questionKey: 'q1',
          text: 'Como você avalia o acolhimento recebido no momento da chegada à UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Demora no atendimento inicial',
            'Falta de orientação ao familiar na chegada',
            'Ambiente pouco acolhedor no primeiro contato',
          ] as [string, string, string],
        },
        {
          questionKey: 'q2',
          text: 'Como você avalia a clareza das informações transmitidas sobre o estado de saúde do paciente?',
          scale: 'rating4' as const,
          subReasons: [
            'Informações transmitidas de forma confusa ou incompleta',
            'Dificuldade em obter atualizações sobre o quadro clínico',
            'Linguagem técnica utilizada sem explicação adequada',
          ] as [string, string, string],
        },
        {
          questionKey: 'q3',
          text: 'Como você avalia a disponibilidade da equipe para esclarecer dúvidas da família ou do paciente durante a permanência na UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Equipe com pouca disponibilidade para atender a família',
            'Perguntas ficaram sem resposta ou foram respondidas superficialmente',
            'Dificuldade de acesso à equipe responsável',
          ] as [string, string, string],
        },
        {
          questionKey: 'q4',
          text: 'Como você avalia o atendimento prestado pela equipe de enfermagem na UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Demora no atendimento às solicitações',
            'Falta de cordialidade ou empatia durante os cuidados',
            'Comunicação insuficiente com o paciente ou familiar',
          ] as [string, string, string],
        },
        {
          questionKey: 'q5',
          text: 'Como você avalia o atendimento prestado pela equipe médica na UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Visitas médicas muito rápidas ou superficiais',
            'Dificuldade de contato com o médico responsável',
            'Informações sobre o quadro clínico foram insuficientes ou confusas',
          ] as [string, string, string],
        },
        {
          questionKey: 'q6',
          text: 'Como você avalia o respeito, a atenção e a empatia demonstrados pela equipe durante o atendimento na UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Sensação de não ter sido tratado com respeito',
            'Falta de empatia em momentos de vulnerabilidade',
            'Pouca atenção individualizada ao paciente ou familiar',
          ] as [string, string, string],
        },
        {
          questionKey: 'q7',
          text: 'Como você avalia a segurança transmitida pela equipe nos cuidados prestados ao paciente na UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Procedimentos realizados sem explicação prévia',
            'Sensação de falta de preparo ou organização da equipe',
            'Dúvidas sobre a segurança dos equipamentos ou materiais utilizados',
          ] as [string, string, string],
        },
        {
          questionKey: 'q8',
          text: 'Como você avalia a higiene e a limpeza do ambiente da UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Limpeza realizada com pouca frequência',
            'Presença de odores desagradáveis na unidade',
            'Ambiente com aparência de sujidade ou desorganização',
          ] as [string, string, string],
        },
        {
          questionKey: 'q9',
          text: 'Como você avalia a organização e a conservação das instalações da UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Ambiente desorganizado ou com itens fora do lugar',
            'Equipamentos com aparência de desgaste ou obsolescência',
            'Falta de organização nos processos de atendimento',
          ] as [string, string, string],
        },
        {
          questionKey: 'q10',
          text: 'Como você avalia as orientações recebidas sobre a rotina e as regras de visita da UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Horários e regras de visita comunicados de forma confusa',
            'Falta de informação sobre a rotina da unidade',
            'Orientações inconsistentes entre diferentes profissionais',
          ] as [string, string, string],
        },
        {
          questionKey: 'q11',
          text: 'Como você avalia a comunicação da equipe com a família ou acompanhante ao longo da internação na UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Dificuldade de contato com a equipe para receber informações',
            'Atualizações sobre o estado do paciente pouco frequentes',
            'Familiar não foi incluído nas orientações sobre o cuidado',
          ] as [string, string, string],
        },
        {
          questionKey: 'q12',
          text: 'Como você avalia a sua experiência geral durante a permanência na UTI?',
          scale: 'rating4' as const,
          subReasons: [
            'Atendimento geral ficou abaixo das expectativas',
            'Problemas com estrutura ou conforto do ambiente',
            'Comunicação insatisfatória ao longo da internação',
          ] as [string, string, string],
        },
      ],
    },
    {
      title: 'Recomendação',
      questions: [
        {
          questionKey: 'nps',
          text: 'Você recomendaria este serviço a um amigo ou familiar?',
          scale: 'nps' as const,
          subReasons: null,
        },
      ],
    },
  ],
};

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'feedbackforms',
    entities: [TenantEntity, FormTemplateEntity, FormTemplateBlockEntity, FormQuestionEntity],
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : false,
  });
  await ds.initialize();
  console.log(`Connected to ${process.env.DB_DATABASE || 'feedbackforms'}`);

  const tenantRepo = ds.getRepository(TenantEntity);
  const templateRepo = ds.getRepository(FormTemplateEntity);
  const blockRepo = ds.getRepository(FormTemplateBlockEntity);
  const questionRepo = ds.getRepository(FormQuestionEntity);

  for (const slug of UTI_TENANTS) {
    console.log(`\n── ${slug} ──`);

    const tenant = await tenantRepo.findOne({ where: { slug } });
    if (!tenant) {
      console.log(`  Tenant not found: ${slug} — skipping`);
      continue;
    }

    // Enable feedback forms for this tenant
    if (!tenant.hasFeedbackForms) {
      await tenantRepo.update(tenant.id, { hasFeedbackForms: true });
      console.log(`  hasFeedbackForms set to true`);
    }

    const existing = await templateRepo.findOne({ where: { tenantId: tenant.id, slug: UTI_TEMPLATE.slug } });
    if (existing) {
      console.log(`  Template already exists: ${UTI_TEMPLATE.slug} — skipping`);
      continue;
    }

    const template = await templateRepo.save(
      templateRepo.create({ tenantId: tenant.id, slug: UTI_TEMPLATE.slug, name: UTI_TEMPLATE.name }),
    );

    for (let bi = 0; bi < UTI_TEMPLATE.blocks.length; bi++) {
      const b = UTI_TEMPLATE.blocks[bi];
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
    console.log(`  Template seeded: ${UTI_TEMPLATE.name} (${UTI_TEMPLATE.blocks[0].questions.length} perguntas + NPS)`);
  }

  await ds.destroy();
  console.log('\nSeed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
