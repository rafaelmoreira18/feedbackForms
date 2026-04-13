-- =============================================================================
-- SCRIPT: Criar usuario PostgreSQL com permissoes minimas (principio do menor privilegio)
-- EXECUTAR: uma unica vez, conectado como superadmin (postgres)
-- BANCO ALVO: Pesquisa_Satisfacao_Paciente_DB
-- =============================================================================

-- 1. Criar o usuario da aplicacao (substitua a senha por uma gerada de forma segura)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'feedbackforms_app') THEN
    CREATE USER feedbackforms_app WITH PASSWORD 'TROQUE_POR_SENHA_FORTE_GERADA';
  END IF;
END
$$;

-- 2. Permissao de conexao ao banco
GRANT CONNECT ON DATABASE "Pesquisa_Satisfacao_Paciente_DB" TO feedbackforms_app;

-- 3. Permissao de uso no schema public
GRANT USAGE ON SCHEMA public TO feedbackforms_app;

-- 4. Permissoes DML nas tabelas que a aplicacao precisa
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  tenants,
  form_templates,
  form_template_blocks,
  form_questions,
  form3_responses,
  training_sessions,
  training_responses,
  audit_logs
TO feedbackforms_app;

-- 5. Permissao em sequences (necessario para PrimaryGeneratedColumn uuid nao precisa,
--    mas se alguma tabela usar SERIAL/SEQUENCE, garantir acesso)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO feedbackforms_app;

-- 6. Garantir que futuras tabelas criadas via migration tambem tenham permissao
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO feedbackforms_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO feedbackforms_app;

-- =============================================================================
-- BANCO ALVO: Autenticacao_DB
-- EXECUTAR separadamente, conectado ao banco Autenticacao_DB
-- =============================================================================

-- GRANT CONNECT ON DATABASE "Autenticacao_DB" TO feedbackforms_app;
-- GRANT USAGE ON SCHEMA public TO feedbackforms_app;
-- GRANT SELECT ON TABLE usuarios, tenants TO feedbackforms_app;
-- GRANT UPDATE ("senhaHash", "mustChangePassword", "atualizadoEm") ON TABLE usuarios TO feedbackforms_app;

-- =============================================================================
-- APOS EXECUTAR:
-- Atualize .env e .env.prod com:
--   DB_USERNAME=feedbackforms_app
--   DB_PASSWORD=<senha gerada acima>
--   AUTH_DB_USERNAME=feedbackforms_app
--   AUTH_DB_PASSWORD=<senha gerada acima>
-- =============================================================================
