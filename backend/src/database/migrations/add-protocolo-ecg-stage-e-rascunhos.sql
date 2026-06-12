-- Run once against o banco principal (DB_DATABASE — Pesquisa_Satisfacao_Paciente_DB).
-- 1) Fraciona a ETAPA 2 (ECG) em um bloco/etapa proprio: nova coluna `ecg` e novo stage 'ecg'.
-- 2) Adiciona rascunhos (stand-by), encerramento antecipado (medico) e historico de alteracoes.

ALTER TABLE protocolos
  ADD COLUMN IF NOT EXISTS ecg                    JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "triagemRascunho"      JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "ecgRascunho"          JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "investigacaoRascunho" JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "desfechoRascunho"     JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS encerramento           JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "historicoAlteracoes"  JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migra dados de ECG que estavam embutidos no bloco triagem para o novo bloco `ecg`.
-- Só para protocolos cuja triagem já foi fechada (triagem IS NOT NULL) e que ainda não têm `ecg`.
UPDATE protocolos
SET ecg = jsonb_build_object(
      'primeiroEcgHora',         COALESCE(triagem->>'primeiroEcgHora', ''),
      'interpretacaoMedicaHora', COALESCE(triagem->>'interpretacaoMedicaHora', ''),
      'resultadoEcg',            COALESCE(triagem->>'resultadoEcg', ''),
      'derivacoesExtras',        COALESCE(triagem->'derivacoesExtras',
                                   '{"v3rV4r":false,"v7v9":false,"ecgSeriado":false}'::jsonb),
      'responsavelNome',         COALESCE(triagem->>'responsavelNome', ''),
      'registroProfissional',    COALESCE(triagem->>'registroProfissional', ''),
      'fechadoEm',               COALESCE(triagem->>'fechadoEm', '')
    )
WHERE triagem IS NOT NULL AND ecg IS NULL;

-- Protocolos que já passaram da triagem mas estavam no stage 'triagem' antigo (englobando ECG)
-- não precisam de ajuste: o stage 'triagem' continua válido como primeira etapa. Protocolos cujo
-- stage era 'investigacao'/'desfecho'/'concluido' permanecem, pois o ECG já foi migrado acima.

COMMENT ON COLUMN protocolos.ecg IS
  'Bloco ECG (ETAPA 2): horarios do ECG, interpretacao, VIA do resultado e derivacoes extras + responsavel.';
COMMENT ON COLUMN protocolos."historicoAlteracoes" IS
  'Historico campo-a-campo: [{bloco,campo,de,para,porUserId,porNome,em}].';
COMMENT ON COLUMN protocolos.encerramento IS
  'Encerramento antecipado pelo medico (nao_continuidade | nao_indicacao) com responsavel e etapa.';
