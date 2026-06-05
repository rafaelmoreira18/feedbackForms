-- Migration: Criar tabela de performance_development_plans (PDI - Plano de Desenvolvimento Individual)
-- Cada registro = 1 PDI, gerado pelo RH a partir de uma avaliacao de desempenho concluida.
-- Fluxo: gestor preenche as acoes + feedback final (managerSubmittedAt), depois o
-- colaborador valida (colaboradorSubmittedAt). Quando ambos respondem -> status 'concluida'.

CREATE TABLE IF NOT EXISTS performance_development_plans (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"                UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "createdByUserId"         UUID DEFAULT NULL,
  slug                      VARCHAR NOT NULL,

  -- Vinculo com a avaliacao de origem
  "evaluationId"            UUID NOT NULL,
  "evaluationSlug"          VARCHAR NOT NULL,

  -- Cabecalho (desnormalizado da avaliacao)
  "colaboradorNome"         VARCHAR NOT NULL,
  setor                     VARCHAR NOT NULL DEFAULT '',
  cargo                     VARCHAR NOT NULL DEFAULT '',
  "gestorArea"              VARCHAR NOT NULL DEFAULT '',
  projeto                   VARCHAR NOT NULL DEFAULT '',
  avaliador                 VARCHAR NOT NULL DEFAULT '',
  "dataAvaliacao"           VARCHAR NOT NULL DEFAULT '',

  -- Conteudo do PDI
  status                    VARCHAR(32) NOT NULL DEFAULT 'pendente',
  actions                   JSONB DEFAULT NULL,
  "managerFeedback"         TEXT DEFAULT NULL,
  "managerSubmittedAt"      TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  -- Validacao do colaborador
  "colaboradorNomeValidacao" VARCHAR DEFAULT NULL,
  "colaboradorComentario"    TEXT DEFAULT NULL,
  "colaboradorSubmittedAt"   TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_pdi_tenant_created ON performance_development_plans ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_pdi_tenant         ON performance_development_plans ("tenantId");
CREATE INDEX IF NOT EXISTS idx_pdi_creator        ON performance_development_plans ("createdByUserId");
CREATE INDEX IF NOT EXISTS idx_pdi_slug           ON performance_development_plans (slug);
CREATE INDEX IF NOT EXISTS idx_pdi_evaluation     ON performance_development_plans ("evaluationId");
CREATE UNIQUE INDEX IF NOT EXISTS uq_pdi_tenant_slug       ON performance_development_plans ("tenantId", slug);
CREATE UNIQUE INDEX IF NOT EXISTS uq_pdi_tenant_evaluation ON performance_development_plans ("tenantId", "evaluationId");

COMMENT ON TABLE performance_development_plans IS
  'PDI - Plano de Desenvolvimento Individual. Gerado pelo RH a partir de uma avaliacao concluida. Gestor preenche acoes + feedback, colaborador valida.';
COMMENT ON COLUMN performance_development_plans.status IS
  'pendente | aguardando_colaborador | concluida';
COMMENT ON COLUMN performance_development_plans.actions IS
  'Array de { acao, responsabilidade (colaborador|empresa), competenciaId, prazo } preenchido pelo gestor.';
COMMENT ON COLUMN performance_development_plans."managerFeedback" IS
  'Feedback final do gestor (texto livre).';
COMMENT ON COLUMN performance_development_plans."colaboradorComentario" IS
  'Comentario opcional do colaborador no momento da validacao.';
