-- Run once against o banco principal (DB_DATABASE — Pesquisa_Satisfacao_Paciente_DB).
-- Histórico por ação (fechamento/edição) das etapas do protocolo, com autor, registro,
-- hora e os campos alterados. Base do resumo mostrado ao usuário ("X fechou", "Y alterou").

ALTER TABLE protocolos
  ADD COLUMN IF NOT EXISTS "historicoAcoes" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill: para protocolos já existentes, registra o fechamento de cada etapa preenchida
-- a partir do responsável/horário que já estão no próprio bloco (sem lista de campos).
UPDATE protocolos p
SET "historicoAcoes" = (
  SELECT COALESCE(jsonb_agg(acao ORDER BY acao->>'em'), '[]'::jsonb)
  FROM (
    SELECT jsonb_build_object(
             'tipo', 'fechamento', 'bloco', b.bloco,
             'porNome', COALESCE(b.dados ->> 'responsavelNome', ''),
             'porRegistro', COALESCE(b.dados ->> 'registroProfissional', ''),
             'porUserId', NULL,
             'em', COALESCE(NULLIF(b.dados ->> 'fechadoEm', ''), p."createdAt"::text),
             'campos', '[]'::jsonb
           ) AS acao
    FROM (VALUES
            ('triagem', p.triagem),
            ('ecg', p.ecg),
            ('investigacao', p.investigacao),
            ('desfecho', p.desfecho)
         ) AS b(bloco, dados)
    WHERE b.dados IS NOT NULL
      AND jsonb_typeof(b.dados) = 'object'
  ) sub
)
WHERE "historicoAcoes" = '[]'::jsonb;

COMMENT ON COLUMN protocolos."historicoAcoes" IS
  'Histórico por ação: [{tipo:fechamento|edicao, bloco, porNome, porRegistro, porUserId, em, campos:[{campo,de,para}]}].';
