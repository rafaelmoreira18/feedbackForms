/**
 * Seed: cria usuários RH da Mediall com sufixo .mediall
 * Senha padrão: 12345678 | mustChangePassword = true
 *
 * Run: npx ts-node -r tsconfig-paths/register src/database/seeds/seed-rh-users-mediall.ts
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.AUTH_DB_HOST,
  port: Number(process.env.AUTH_DB_PORT ?? 5432),
  user: process.env.AUTH_DB_USERNAME,
  password: process.env.AUTH_DB_PASSWORD,
  database: process.env.AUTH_DB_DATABASE,
  ssl:
    process.env.AUTH_DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.AUTH_DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
});

// Tenant IDs vindos do banco (Pesquisa_Satisfacao_Paciente_DB)
const TENANT_MAP: Record<string, string> = {
  hrpg:         '00000000-0000-0000-0000-000000000001', // Porto Grande
  uei:          '0867b34a-6188-459e-9f53-8662ba8b1dc5', // UEI
  upa:          '817dd500-d1e2-4e9f-b2c7-f1cff4e1a902', // UPA
  hmmdo:        '29dbeb25-3c98-4090-9309-0f528dd19db0', // Machadinho
  'uti-hmab':   '9a466024-37df-4e96-94bb-d5f3976c0809', // HMAB
  'uti-tefe':   'b07f024c-0e50-4a55-a0ea-bd78fca41eca', // Tefé
  'uti-tabatinga': 'd8699d75-c8dd-4b54-a788-7ca91aedfb8b', // Tabatinga
  'uti-humaita':   '32971768-8bbb-434f-94a8-7911e082508c', // Humaitá
  hrgm:         'eed4c568-dc7a-4174-9ad8-9a33fb765be5', // Guajará
};

interface RhUser {
  nome: string;
  username: string; // login = username.mediall
  tenantSlug: string;
}

const USERS: RhUser[] = [
  // PORTO GRANDE
  { nome: 'Maycon',    username: 'maycon.mediall',    tenantSlug: 'hrpg' },
  { nome: 'Hellen',    username: 'hellen.mediall',    tenantSlug: 'hrpg' },
  { nome: 'Alcivan',   username: 'alcivan.mediall',   tenantSlug: 'hrpg' },
  { nome: 'Janiel',    username: 'janiel.mediall',    tenantSlug: 'hrpg' },
  // UEI
  { nome: 'Lidiene',   username: 'lidiene.mediall',   tenantSlug: 'uei' },
  { nome: 'Hellen',    username: 'hellen.uei.mediall',tenantSlug: 'uei' },
  // UPA
  { nome: 'Andressa',  username: 'andressa.mediall',  tenantSlug: 'upa' },
  { nome: 'Hellen',    username: 'hellen.upa.mediall',tenantSlug: 'upa' },
  // MACHADINHO
  { nome: 'Aieska',    username: 'aieska.mediall',    tenantSlug: 'hmmdo' },
  { nome: 'Jessica',   username: 'jessica.mediall',   tenantSlug: 'hmmdo' },
  // HMAB
  { nome: 'Taiz',      username: 'taiz.mediall',      tenantSlug: 'uti-hmab' },
  // TEFÉ
  { nome: 'Sandro',    username: 'sandro.uti-tefe.mediall',   tenantSlug: 'uti-tefe' },
  { nome: 'Franderson',username: 'franderson.mediall',    tenantSlug: 'uti-tefe' },
  // TABATINGA
  { nome: 'Sandro',    username: 'sandro.uti-tabatinga.mediall', tenantSlug: 'uti-tabatinga' },
  { nome: 'Antonio',   username: 'antonio.mediall',   tenantSlug: 'uti-tabatinga' },
  // HUMAITÁ
  { nome: 'Carlos',    username: 'carlos.mediall',    tenantSlug: 'uti-humaita' },
  { nome: 'Sandro',    username: 'sandro.uti-humaita.mediall', tenantSlug: 'uti-humaita' },
  // GUAJARÁ
  { nome: 'Wesley',    username: 'wesley.mediall',    tenantSlug: 'hrgm' },
  { nome: 'Ana',       username: 'ana.mediall',       tenantSlug: 'hrgm' },
  { nome: 'Emison',    username: 'emison.mediall',    tenantSlug: 'hrgm' },
];

const DEFAULT_PASSWORD = '12345678';

async function seed() {
  const senhaHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  let created = 0;
  let skipped = 0;

  for (const user of USERS) {
    const email = `${user.username}@sistema.local`;
    const tenantId = TENANT_MAP[user.tenantSlug] ?? null;

    const existing = await pool.query(
      `SELECT id FROM usuarios WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (existing.rows.length > 0) {
      console.log(`⚠  Já existe: ${email} — pulando`);
      skipped++;
      continue;
    }

    await pool.query(
      `INSERT INTO usuarios (id, email, username, nome, "senhaHash", role, "tenantId", ativo, "mustChangePassword", "criadoEm", "atualizadoEm")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'rh', $5, true, true, NOW(), NOW())`,
      [email, user.username, user.nome, senhaHash, tenantId],
    );

    console.log(`✓  Criado: ${email}  (${user.tenantSlug})`);
    created++;
  }

  console.log(`\nConcluído: ${created} criado(s), ${skipped} pulado(s).`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
