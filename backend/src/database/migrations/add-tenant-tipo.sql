-- Run this once against feedbackforms DB (DB_DATABASE)
-- Adds the `tipo` column to the tenants table (Phase 1.3).
-- Values: 'hospital' | 'UEI' | 'clinica' | 'laboratorio'

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tipo varchar NOT NULL DEFAULT 'hospital';
