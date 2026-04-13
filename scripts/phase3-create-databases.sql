-- =============================================================================
-- Phase 3 — Criação dos bancos no RDS
-- Rodar UMA VEZ contra o servidor RDS, conectado ao banco postgres (padrão).
--
-- Pré-requisito: ter acesso de superuser (postgres) no RDS.
--
-- Como rodar:
--   psql "postgresql://postgres:SENHA@dbpgpesquisamkt.ce6ipyxrb0gc.sa-east-1.rds.amazonaws.com:5432/postgres?sslmode=require" \
--     -f scripts/phase3-create-databases.sql
--
-- Verificar depois:
--   \l
-- =============================================================================

-- Banco de autenticação compartilhado entre todos os sistemas.
-- Futuramente será a base do Auth Service (microserviço).
CREATE DATABASE "Autenticacao_DB"
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- Banco do sistema de pesquisa de satisfação de pacientes (FeedbackForms).
-- Substitui dbpgpesquisamkt como nome canônico.
CREATE DATABASE "Pesquisa_Satisfacao_Paciente_DB"
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- Banco do sistema de patrimônio e manutenção (LinenSistem / API Trilogo).
-- Substitui as tabelas operacionais que estão no Multi_UnidadesDB.
CREATE DATABASE "Patrimonio_API_Trilogo_DB"
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.UTF-8'
  LC_CTYPE = 'en_US.UTF-8'
  TEMPLATE = template0;

-- Verificar resultado:
-- SELECT datname, pg_encoding_to_char(encoding) AS encoding
-- FROM pg_database
-- WHERE datname IN (
--   'Autenticacao_DB',
--   'Pesquisa_Satisfacao_Paciente_DB',
--   'Patrimonio_API_Trilogo_DB'
-- );
