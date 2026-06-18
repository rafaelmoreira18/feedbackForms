-- Run once against o banco principal (DB_DATABASE).
-- Suporte a múltiplos tipos de protocolo (Sepse, além de Dor Torácica):
--   1) Armazenamento GENÉRICO de blocos por etapa: mapa JSONB `blocos`/`rascunhos`
--      (`{ "<stageKey>": <dados> }`) — fonte de verdade para todos os tipos.
--   2) `pesoKg` e `variante` (adulto|pediatrico) no cabeçalho (usados pela Sepse).
--   3) Backfill dos blocos nomeados de Dor Torácica para o mapa genérico.
-- As colunas nomeadas legadas (triagem/ecg/investigacao/desfecho + *Rascunho) são
-- MANTIDAS como rede de segurança; o código novo passa a usar apenas `blocos`/`rascunhos`.

ALTER TABLE protocolos
  ADD COLUMN IF NOT EXISTS blocos    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rascunhos JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "pesoKg"  VARCHAR NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS variante  VARCHAR(12) NOT NULL DEFAULT '';

-- Backfill dos blocos fechados (Dor Torácica) → mapa `blocos`.
UPDATE protocolos
SET blocos = (
  SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
  FROM (VALUES
    ('triagem',      triagem),
    ('ecg',          ecg),
    ('investigacao', investigacao),
    ('desfecho',     desfecho)
  ) AS t(k, v)
  WHERE v IS NOT NULL
)
WHERE blocos = '{}'::jsonb
  AND (triagem IS NOT NULL OR ecg IS NOT NULL OR investigacao IS NOT NULL OR desfecho IS NOT NULL);

-- Backfill dos rascunhos (stand-by) → mapa `rascunhos`.
UPDATE protocolos
SET rascunhos = (
  SELECT COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
  FROM (VALUES
    ('triagem',      "triagemRascunho"),
    ('ecg',          "ecgRascunho"),
    ('investigacao', "investigacaoRascunho"),
    ('desfecho',     "desfechoRascunho")
  ) AS t(k, v)
  WHERE v IS NOT NULL
)
WHERE rascunhos = '{}'::jsonb
  AND ("triagemRascunho" IS NOT NULL OR "ecgRascunho" IS NOT NULL
       OR "investigacaoRascunho" IS NOT NULL OR "desfechoRascunho" IS NOT NULL);

COMMENT ON COLUMN protocolos.blocos IS
  'Mapa genérico de blocos por etapa { "<stageKey>": <dados> } — fonte de verdade (todos os tipos).';
COMMENT ON COLUMN protocolos.rascunhos IS
  'Mapa genérico de rascunhos (stand-by) por etapa { "<stageKey>": <parcial> }.';
COMMENT ON COLUMN protocolos.variante IS
  'Sepse: variante resolvida pela idade (adulto | pediatrico). Vazio nos demais tipos.';
COMMENT ON COLUMN protocolos."pesoKg" IS
  'Sepse pediátrica: peso em kg para cálculo de doses. Vazio nos demais.';
