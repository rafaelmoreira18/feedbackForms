-- Migration: add_categoria_visibilidade_to_pesquisas_corporativas
-- Descrição: Adiciona suporte a categorias (pastas) e controle de visibilidade
--            nas pesquisas corporativas.
-- Impacto em produção: zero — colunas nullable ou com default seguro.
-- Autor: Rafael Moreira
-- Data: 2026-05-05

-- ─── UP ───────────────────────────────────────────────────────────────────────

ALTER TABLE pesquisas_corporativas
  ADD COLUMN IF NOT EXISTS categoria          VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS visibility         VARCHAR(20)  NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS "allowedTenantIds" UUID[]       NULL;

CREATE INDEX IF NOT EXISTS idx_pesquisas_corporativas_visibility
  ON pesquisas_corporativas (visibility);

CREATE INDEX IF NOT EXISTS idx_pesquisas_corporativas_categoria
  ON pesquisas_corporativas (categoria);

-- ─── DOWN (rollback) ──────────────────────────────────────────────────────────
-- Para reverter, executar manualmente:
--
-- DROP INDEX IF EXISTS idx_pesquisas_corporativas_visibility;
-- DROP INDEX IF EXISTS idx_pesquisas_corporativas_categoria;
-- ALTER TABLE pesquisas_corporativas
--   DROP COLUMN IF EXISTS categoria,
--   DROP COLUMN IF EXISTS visibility,
--   DROP COLUMN IF EXISTS "allowedTenantIds";
