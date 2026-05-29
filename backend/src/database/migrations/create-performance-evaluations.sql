-- Migration: Criar tabela de performance_evaluations (Avaliacao de Desempenho)
-- Cada registro = 1 colaborador avaliado.
-- Fluxo: gestor responde primeiro (managerAnswers), depois o colaborador
-- faz a autoavaliacao (selfAnswers). Quando ambos respondem -> status 'concluida'.

CREATE TABLE IF NOT EXISTS performance_evaluations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "createdByUserId"    UUID DEFAULT NULL,
  slug                 VARCHAR NOT NULL,

  -- Cabecalho
  "colaboradorNome"    VARCHAR NOT NULL,
  setor                VARCHAR NOT NULL DEFAULT '',
  cargo                VARCHAR NOT NULL DEFAULT '',
  "gestorArea"         VARCHAR NOT NULL DEFAULT '',
  projeto              VARCHAR NOT NULL DEFAULT '',
  avaliador            VARCHAR NOT NULL DEFAULT '',
  "dataAvaliacao"      VARCHAR NOT NULL DEFAULT '',

  -- Respostas
  status               VARCHAR(32) NOT NULL DEFAULT 'pendente',
  "managerAnswers"     JSONB DEFAULT NULL,
  "selfAnswers"        JSONB DEFAULT NULL,
  "managerSubmittedAt" TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  "selfSubmittedAt"    TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  active               BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_perf_eval_tenant_created ON performance_evaluations ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_perf_eval_tenant         ON performance_evaluations ("tenantId");
CREATE INDEX IF NOT EXISTS idx_perf_eval_creator        ON performance_evaluations ("createdByUserId");
CREATE INDEX IF NOT EXISTS idx_perf_eval_slug           ON performance_evaluations (slug);
CREATE UNIQUE INDEX IF NOT EXISTS uq_perf_eval_tenant_slug ON performance_evaluations ("tenantId", slug);

COMMENT ON TABLE performance_evaluations IS
  'Avaliacao de desempenho por colaborador. Gestor responde primeiro, colaborador faz a autoavaliacao depois.';
COMMENT ON COLUMN performance_evaluations.status IS
  'pendente | aguardando_colaborador | concluida';
COMMENT ON COLUMN performance_evaluations."managerAnswers" IS
  'Array de { competenciaId, valor (0-10), justificativa } preenchido pelo gestor.';
COMMENT ON COLUMN performance_evaluations."selfAnswers" IS
  'Array de { competenciaId, valor (0-10), justificativa } preenchido pelo colaborador (autoavaliacao).';
