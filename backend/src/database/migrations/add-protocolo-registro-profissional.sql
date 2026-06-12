-- Run once against o banco de autenticação Autenticacao_DB (AUTH_DB_DATABASE).
-- Adiciona o registro profissional (CRM/COREN) aos usuários do módulo Protocolos.
-- Aplica-se apenas a usuários de protocolo (roles protocolo_*). Demais sistemas ignoram a coluna.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS "registroProfissional" varchar(40) NOT NULL DEFAULT '';

COMMENT ON COLUMN usuarios."registroProfissional" IS
  'Protocolos: número de registro do conselho (CRM p/ médico, COREN p/ enfermagem). Vazio p/ usuários de outros sistemas.';

-- Backfill: usuários de protocolo já existentes (operador) ficam com registro vazio até serem
-- editados/recriados pelo admin. O frontend exige o registro apenas em novas criações.
