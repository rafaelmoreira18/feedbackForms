-- Migration: Criar tabela de anxiety_assessments (Avaliacao de Ansiedade — BAI / GAD-7)
-- Cada registro = 1 aplicacao por colaborador + data, carregando OS DOIS instrumentos.
-- O colaborador responde via link publico; o escore total e a classificacao de
-- gravidade sao calculados no submit (faixas clinicas padrao).

CREATE TABLE IF NOT EXISTS anxiety_assessments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId"           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  "createdByUserId"    UUID DEFAULT NULL,
  slug                 VARCHAR NOT NULL,

  -- Cabecalho (por colaborador)
  "colaboradorNome"    VARCHAR NOT NULL,
  cargo                VARCHAR NOT NULL DEFAULT '',
  setor                VARCHAR NOT NULL DEFAULT '',
  "dataAplicacao"      VARCHAR NOT NULL DEFAULT '',

  -- BAI (21 itens, escore 0..63)
  "baiRespostas"       JSONB DEFAULT NULL,
  "baiEscore"          INTEGER DEFAULT NULL,
  "baiClassificacao"   VARCHAR(16) DEFAULT NULL,
  "baiRespondidoEm"    TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  -- GAD-7 (7 itens, escore 0..21)
  "gad7Respostas"      JSONB DEFAULT NULL,
  "gad7Escore"         INTEGER DEFAULT NULL,
  "gad7Classificacao"  VARCHAR(16) DEFAULT NULL,
  "gad7RespondidoEm"   TIMESTAMP WITH TIME ZONE DEFAULT NULL,

  active               BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_anxiety_tenant_created ON anxiety_assessments ("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_anxiety_tenant         ON anxiety_assessments ("tenantId");
CREATE INDEX IF NOT EXISTS idx_anxiety_creator        ON anxiety_assessments ("createdByUserId");
CREATE INDEX IF NOT EXISTS idx_anxiety_slug           ON anxiety_assessments (slug);
CREATE UNIQUE INDEX IF NOT EXISTS uq_anxiety_tenant_slug ON anxiety_assessments ("tenantId", slug);

COMMENT ON TABLE anxiety_assessments IS
  'Avaliacao de ansiedade por colaborador. Cada registro carrega BAI e GAD-7, respondidos via link publico.';
COMMENT ON COLUMN anxiety_assessments."baiRespostas" IS
  'Array de { itemId (1..21), value (0..3) } do BAI.';
COMMENT ON COLUMN anxiety_assessments."baiClassificacao" IS
  'minima | leve | moderada | grave (faixas BAI: 0-7 / 8-15 / 16-25 / 26-63).';
COMMENT ON COLUMN anxiety_assessments."gad7Respostas" IS
  'Array de { itemId (1..7), value (0..3) } do GAD-7.';
COMMENT ON COLUMN anxiety_assessments."gad7Classificacao" IS
  'minima | leve | moderada | grave (faixas GAD-7: 0-4 / 5-9 / 10-14 / 15-21).';
