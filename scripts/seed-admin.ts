/**
 * Script para:
 * 1. Criar as tabelas no banco (se não existirem)
 * 2. Criar usuário admin inicial
 * 3. Testar login via API local ou produção
 *
 * Uso: npx tsx scripts/seed-admin.ts
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Credenciais do banco (mesmas variáveis de ambiente da Vercel)
const pool = new Pool({
  host: process.env.DB_HOST || 'dbpgpesquisamkt.ce6ipyxrb0gc.sa-east-1.rds.amazonaws.com',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'dbpgpesquisamkt',
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('Conectando ao banco...');
  const client = await pool.connect();

  try {
    // 1. Criar extensão e tabelas
    console.log('Criando tabelas...');
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        role        TEXT NOT NULL CHECK (role IN ('global_admin', 'admin')) DEFAULT 'admin',
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS form_responses (
        id                    UUID PRIMARY KEY,
        "patientName"         TEXT,
        "patientCpf"          TEXT,
        "patientAge"          INTEGER,
        "patientGender"       TEXT,
        "admissionDate"       TEXT,
        "dischargeDate"       TEXT,
        "evaluatedDepartment" TEXT,
        satisfaction          JSONB,
        experience            JSONB,
        comments              TEXT,
        "createdAt"           TIMESTAMP NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS form2_responses (
        id               UUID PRIMARY KEY,
        "patientName"    TEXT,
        "patientCpf"     TEXT,
        "patientAge"     INTEGER,
        "patientGender"  TEXT,
        "admissionDate"  TEXT,
        "dischargeDate"  TEXT,
        infrastructure   JSONB,
        "patientSafety"  JSONB,
        comments         TEXT,
        "createdAt"      TIMESTAMP NOT NULL
      )
    `);

    console.log('Tabelas criadas com sucesso.');

    // 2. Criar usuário admin
    const adminPassword = 'Admin@2026';
    const hash = await bcrypt.hash(adminPassword, 10);

    const existing = await client.query('SELECT id FROM users WHERE email = $1', ['admin@mediallquality.com']);

    if (existing.rows.length > 0) {
      // Atualiza o hash da senha se o usuário já existe
      await client.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@mediallquality.com']);
      console.log('Usuário admin atualizado (senha redefinida).');
    } else {
      await client.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
        ['Administrador', 'admin@mediallquality.com', hash, 'global_admin']
      );
      console.log('Usuário admin criado com sucesso.');
    }

    console.log('\n  Email: admin@mediallquality.com');
    console.log('  Senha: Admin@2026');
    console.log('\nTabelas existentes:');

    const tables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);
    tables.rows.forEach(r => console.log(' -', r.tablename));

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
