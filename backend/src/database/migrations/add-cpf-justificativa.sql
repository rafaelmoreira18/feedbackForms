-- Migration (dev): add cpf_justificativa and cpf_added_at to form3_responses
-- Allows CPF to be omitted at submission time with a mandatory justification.
-- A holding_admin can later add the CPF only when patientCpf IS NULL.

ALTER TABLE form3_responses
  ALTER COLUMN "patientCpf" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "cpfJustificativa" VARCHAR(60) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "cpfAddedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT NULL;

-- Existing rows already have a CPF — cpfJustificativa and cpfAddedAt stay NULL
-- (they were informed at submission and need no justification).
