-- Run this once against feedbackforms DB (DB_DATABASE)
-- Adds the `troponinaModoPadrao` column to the tenants table.
-- Modo padrão do resultado de troponina (protocolo Dor Torácica) para novas coletas.
-- Values: 'quantitativo' (ng/mL) | 'qualitativo' (Positivo/Negativo)

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS "troponinaModoPadrao" varchar NOT NULL DEFAULT 'quantitativo';
