-- Migration: Criar tabela de audit_logs
-- Executar contra: Pesquisa_Satisfacao_Paciente_DB
-- Esta tabela e imutavel: nenhum UPDATE ou DELETE deve ser feito nela.
-- Representa a trilha de auditoria exigida pela ONA e boas praticas de seguranca.

CREATE TABLE IF NOT EXISTS audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"    VARCHAR NOT NULL,
  "userId"      VARCHAR DEFAULT NULL,
  "userEmail"   VARCHAR DEFAULT NULL,
  action        VARCHAR NOT NULL,
  "entityType"  VARCHAR NOT NULL,
  "entityId"    VARCHAR DEFAULT NULL,
  "ipAddress"   VARCHAR DEFAULT NULL,
  details       JSONB DEFAULT NULL,
  "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices para consultas de auditoria frequentes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created  ON audit_logs ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity          ON audit_logs ("entityType", "entityId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user            ON audit_logs ("userId");

-- Comentarios para documentar a tabela
COMMENT ON TABLE audit_logs IS
  'Trilha de auditoria imutavel. Registra quem fez o que, em qual registro, quando e de qual IP. Nao deve sofrer UPDATE ou DELETE.';

COMMENT ON COLUMN audit_logs.action IS
  'Acao realizada. Ex: FORM_CREATED, FORM_DELETED, FORM_BULK_DELETED, FORM_CPF_UPDATED, TRAINING_SESSION_CREATED, TRAINING_SESSION_UPDATED, TRAINING_SESSION_DELETED, TRAINING_RESPONSE_CREATED, TRAINING_RESPONSE_DELETED';

COMMENT ON COLUMN audit_logs."entityType" IS
  'Tipo da entidade afetada. Ex: form3_response, training_session, training_response';
