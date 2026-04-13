ALTER TABLE form3_responses
  ADD COLUMN IF NOT EXISTS "recusouResponder" boolean NOT NULL DEFAULT false;
