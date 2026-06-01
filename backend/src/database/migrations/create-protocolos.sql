-- Migration: Criar tabela de protocolos (Protocolo de Dor Toracica — FORMMED027)
-- Cada registro = 1 paciente/atendimento. Preenchimento sequencial em 3 blocos:
--   triagem -> investigacao -> desfecho. Cada bloco e fechado por um profissional
--   (nome + registro profissional) e libera o proximo. Fechar 'desfecho' conclui.

CREATE TABLE IF NOT EXISTS protocolos (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"          UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "protocolType"      VARCHAR(40) NOT NULL DEFAULT 'dor_toracica',
  slug                VARCHAR NOT NULL,
  "createdByUserId"   UUID DEFAULT NULL,

  -- Cabecalho do paciente
  "pacienteNome"      VARCHAR NOT NULL,
  "numeroProntuario"  VARCHAR NOT NULL DEFAULT '',
  "dataNascimento"    VARCHAR NOT NULL DEFAULT '',
  idade               VARCHAR NOT NULL DEFAULT '',
  sexo                VARCHAR(1) NOT NULL DEFAULT '',
  "dataAtendimento"   VARCHAR NOT NULL DEFAULT '',
  "horaChegada"       VARCHAR NOT NULL DEFAULT '',

  -- Estado / blocos (JSONB, null ate o bloco ser fechado)
  "currentStage"      VARCHAR(20) NOT NULL DEFAULT 'triagem',
  triagem             JSONB DEFAULT NULL,
  investigacao        JSONB DEFAULT NULL,
  desfecho            JSONB DEFAULT NULL,

  active              BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "deletedAt"         TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_protocolos_tenant_created ON protocolos ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_protocolos_tenant_stage   ON protocolos ("tenantId", "currentStage");
CREATE INDEX IF NOT EXISTS idx_protocolos_tenant         ON protocolos ("tenantId");
CREATE INDEX IF NOT EXISTS idx_protocolos_creator        ON protocolos ("createdByUserId");
CREATE UNIQUE INDEX IF NOT EXISTS uq_protocolos_tenant_slug ON protocolos ("tenantId", slug);

COMMENT ON TABLE protocolos IS
  'Protocolo de Dor Toracica (FORMMED027). Preenchimento sequencial em 3 blocos por profissionais distintos.';
COMMENT ON COLUMN protocolos."currentStage" IS
  'triagem | investigacao | desfecho | concluido — etapa em aberto. Fechar desfecho conclui o protocolo.';
COMMENT ON COLUMN protocolos.triagem IS
  'Bloco 1: ETAPA 1 (triagem/sinais vitais/Manchester) + ETAPA 2 (ECG) + responsavel (nome/registro/fechadoEm).';
COMMENT ON COLUMN protocolos.investigacao IS
  'Bloco 2: troponina 0-3-6h + Escore HEART + diagnosticos diferenciais + responsavel.';
COMMENT ON COLUMN protocolos.desfecho IS
  'Bloco 3: trombolise (VIA I) + encaminhamento final + assinaturas + responsavel.';
