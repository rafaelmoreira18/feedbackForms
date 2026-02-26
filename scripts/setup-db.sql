-- =============================================================
-- Setup inicial do banco de dados
-- Execute este script no RDS PostgreSQL uma única vez
-- =============================================================

-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- Tabela de usuários (admin)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password      TEXT NOT NULL,  -- bcrypt hash
  role          TEXT NOT NULL CHECK (role IN ('global_admin', 'admin')) DEFAULT 'admin',
  "createdAt"   TIMESTAMP DEFAULT NOW()
);

-- -------------------------------------------------------------
-- Tabela de respostas do Formulário 1 (pesquisa de satisfação)
-- -------------------------------------------------------------
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
);

-- -------------------------------------------------------------
-- Tabela de respostas do Formulário 2 (infraestrutura)
-- -------------------------------------------------------------
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
);

-- -------------------------------------------------------------
-- Usuário admin inicial
-- Senha: Admin@2026  (hash bcrypt gerado com 10 rounds)
-- TROQUE A SENHA após o primeiro login!
-- -------------------------------------------------------------
INSERT INTO users (name, email, password, role)
VALUES (
  'Administrador',
  'admin@mediallquality.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uDzCuXVkK', -- senha: password (trocar!)
  'global_admin'
)
ON CONFLICT (email) DO NOTHING;
