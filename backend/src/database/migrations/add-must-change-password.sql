-- Run this once against Multi_UnidadesDB (AUTH_DB_DATABASE)
-- Adds the mustChangePassword flag to the usuarios table.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS "mustChangePassword" boolean NOT NULL DEFAULT false;
