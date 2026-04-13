#!/usr/bin/env bash
# =============================================================================
# Phase 3 — Database Separation Migration Script
#
# Bancos alvo (mesmo servidor RDS):
#   Autenticacao_DB                  ← tenants + usuarios
#   Pesquisa_Satisfacao_Paciente_DB  ← formulários, respostas, treinamentos
#   Patrimonio_API_Trilogo_DB        ← manutenção, rondas, patrimônio
#
# Pré-requisitos:
#   - Phase 1 e 2 deployadas e estáveis por ao menos 1 semana
#   - Backup fresco tirado imediatamente antes
#   - Os 3 bancos alvo já criados no RDS (rode o SQL abaixo primeiro):
#
#       CREATE DATABASE "Autenticacao_DB";
#       CREATE DATABASE "Pesquisa_Satisfacao_Paciente_DB";
#       CREATE DATABASE "Patrimonio_API_Trilogo_DB";
#
#   - App NÃO precisa estar em manutenção neste passo —
#     os bancos novos recebem uma cópia, o original não é tocado.
#     O downtime (~5 min) só acontece no cutover (deploy com .env atualizado).
#
# Uso:
#   export RDS_HOST="dbpgpesquisamkt.ce6ipyxrb0gc.sa-east-1.rds.amazonaws.com"
#   export RDS_USER="postgres"
#   export RDS_PASS="sua-senha-de-producao"
#   bash scripts/phase3-migrate.sh
# =============================================================================

set -euo pipefail

RDS_HOST="${RDS_HOST:-dbpgpesquisamkt.ce6ipyxrb0gc.sa-east-1.rds.amazonaws.com}"
RDS_USER="${RDS_USER:-postgres}"
RDS_PORT="${RDS_PORT:-5432}"

if [[ -z "${RDS_PASS:-}" ]]; then
  echo "ERROR: RDS_PASS deve estar definido."
  exit 1
fi

export PGPASSWORD="$RDS_PASS"

SOURCE_URL="postgresql://${RDS_USER}:${RDS_PASS}@${RDS_HOST}:${RDS_PORT}/Multi_UnidadesDB?sslmode=require"
AUTH_URL="postgresql://${RDS_USER}:${RDS_PASS}@${RDS_HOST}:${RDS_PORT}/Autenticacao_DB?sslmode=require"
PESQUISA_URL="postgresql://${RDS_USER}:${RDS_PASS}@${RDS_HOST}:${RDS_PORT}/Pesquisa_Satisfacao_Paciente_DB?sslmode=require"
PATRIMONIO_URL="postgresql://${RDS_USER}:${RDS_PASS}@${RDS_HOST}:${RDS_PORT}/Patrimonio_API_Trilogo_DB?sslmode=require"

PSQL="/c/Program Files/PostgreSQL/18/bin/psql"
PGDUMP="/c/Program Files/PostgreSQL/18/bin/pg_dump"

echo ""
echo "============================================================"
echo "  Phase 3 — Separação de Bancos"
echo "  Host: $RDS_HOST"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""

# ── 1. Contar registros na origem ─────────────────────────────────────────────

echo "[1/7] Contando registros na origem (Multi_UnidadesDB)..."

COUNT_TENANTS=$("$PSQL" "$SOURCE_URL" -tAc "SELECT COUNT(*) FROM tenants")
COUNT_USUARIOS=$("$PSQL" "$SOURCE_URL" -tAc "SELECT COUNT(*) FROM usuarios")
COUNT_RODADAS=$("$PSQL" "$SOURCE_URL" -tAc "SELECT COUNT(*) FROM rodadas" 2>/dev/null || echo "0")
COUNT_AGENDAMENTOS=$("$PSQL" "$SOURCE_URL" -tAc "SELECT COUNT(*) FROM agendamentos_manutencao" 2>/dev/null || echo "0")

echo "  tenants:              $COUNT_TENANTS"
echo "  usuarios:             $COUNT_USUARIOS"
echo "  rodadas:              $COUNT_RODADAS"
echo "  agendamentos:         $COUNT_AGENDAMENTOS"
echo ""

# ── 2. Migrar → Autenticacao_DB ───────────────────────────────────────────────

echo "[2/7] Copiando tenants + usuarios → Autenticacao_DB..."
"$PGDUMP" "$SOURCE_URL" --no-owner --no-acl -t tenants -t usuarios | "$PSQL" "$AUTH_URL"

AUTH_TENANTS=$("$PSQL" "$AUTH_URL" -tAc "SELECT COUNT(*) FROM tenants")
AUTH_USUARIOS=$("$PSQL" "$AUTH_URL" -tAc "SELECT COUNT(*) FROM usuarios")

[[ "$AUTH_TENANTS" != "$COUNT_TENANTS" ]] && { echo "ERRO: tenants diverge — origem=$COUNT_TENANTS auth=$AUTH_TENANTS"; exit 1; }
[[ "$AUTH_USUARIOS" != "$COUNT_USUARIOS" ]] && { echo "ERRO: usuarios diverge — origem=$COUNT_USUARIOS auth=$AUTH_USUARIOS"; exit 1; }

echo "  tenants:  $AUTH_TENANTS / $COUNT_TENANTS OK"
echo "  usuarios: $AUTH_USUARIOS / $COUNT_USUARIOS OK"
echo ""

# ── 3. Migrar → Pesquisa_Satisfacao_Paciente_DB ───────────────────────────────
# O banco dbpgpesquisamkt já existe no RDS com as tabelas do FeedbackForms.
# Este passo cria o Pesquisa_Satisfacao_Paciente_DB como banco canônico.
# Se preferir apenas renomear dbpgpesquisamkt, faça manualmente no RDS e pule este passo.

echo "[3/7] Copiando tabelas feedbackforms → Pesquisa_Satisfacao_Paciente_DB..."

FEEDBACKFORMS_SOURCE="postgresql://${RDS_USER}:${RDS_PASS}@${RDS_HOST}:${RDS_PORT}/dbpgpesquisamkt?sslmode=require"

TABLES_PESQUISA=(form_templates form_template_blocks form_questions form3_responses training_sessions training_responses tenants)

for TABLE in "${TABLES_PESQUISA[@]}"; do
  COUNT=$("$PSQL" "$FEEDBACKFORMS_SOURCE" -tAc "SELECT COUNT(*) FROM $TABLE" 2>/dev/null || echo "SKIP")
  if [[ "$COUNT" == "SKIP" ]]; then
    echo "  $TABLE: não encontrada, pulando"
    continue
  fi
  "$PGDUMP" "$FEEDBACKFORMS_SOURCE" --no-owner --no-acl -t "$TABLE" | "$PSQL" "$PESQUISA_URL"
  DEST_COUNT=$("$PSQL" "$PESQUISA_URL" -tAc "SELECT COUNT(*) FROM $TABLE" 2>/dev/null || echo "0")
  [[ "$DEST_COUNT" != "$COUNT" ]] && { echo "ERRO: $TABLE diverge — origem=$COUNT destino=$DEST_COUNT"; exit 1; }
  echo "  $TABLE: $DEST_COUNT / $COUNT OK"
done
echo ""

# ── 4. Migrar → Patrimonio_API_Trilogo_DB ────────────────────────────────────

echo "[4/7] Copiando tabelas LinenSistem → Patrimonio_API_Trilogo_DB..."

TABLES_PATRIMONIO=(
  rodadas
  agendamentos_manutencao
  ambientes_inspecionados
  ambientes_tenant
  blocos_tenant
  pessoas
  movimentacoes
  rondas_ocorrencias
  rondas_draft
  registros_ambientes
  ocorrencias_detalhe
  abastecimentos
  alteracoes
  links_publicos_bens
)

for TABLE in "${TABLES_PATRIMONIO[@]}"; do
  COUNT=$("$PSQL" "$SOURCE_URL" -tAc "SELECT COUNT(*) FROM $TABLE" 2>/dev/null || echo "SKIP")
  if [[ "$COUNT" == "SKIP" ]]; then
    echo "  $TABLE: não encontrada, pulando"
    continue
  fi
  "$PGDUMP" "$SOURCE_URL" --no-owner --no-acl -t "$TABLE" | "$PSQL" "$PATRIMONIO_URL"
  DEST_COUNT=$("$PSQL" "$PATRIMONIO_URL" -tAc "SELECT COUNT(*) FROM $TABLE" 2>/dev/null || echo "0")
  [[ "$DEST_COUNT" != "$COUNT" ]] && { echo "ERRO: $TABLE diverge — origem=$COUNT destino=$DEST_COUNT"; exit 1; }
  echo "  $TABLE: $DEST_COUNT / $COUNT OK"
done
echo ""

# ── 5. Verificação final ──────────────────────────────────────────────────────

echo "[5/7] Verificação final de contagens..."
echo ""
echo "  Autenticacao_DB:"
echo "    tenants:  $("$PSQL" "$AUTH_URL" -tAc "SELECT COUNT(*) FROM tenants")"
echo "    usuarios: $("$PSQL" "$AUTH_URL" -tAc "SELECT COUNT(*) FROM usuarios")"
echo ""
echo "  Pesquisa_Satisfacao_Paciente_DB:"
echo "    form_templates:    $("$PSQL" "$PESQUISA_URL" -tAc "SELECT COUNT(*) FROM form_templates" 2>/dev/null || echo 0)"
echo "    form3_responses:   $("$PSQL" "$PESQUISA_URL" -tAc "SELECT COUNT(*) FROM form3_responses" 2>/dev/null || echo 0)"
echo "    training_sessions: $("$PSQL" "$PESQUISA_URL" -tAc "SELECT COUNT(*) FROM training_sessions" 2>/dev/null || echo 0)"
echo ""
echo "  Patrimonio_API_Trilogo_DB:"
echo "    rodadas:              $("$PSQL" "$PATRIMONIO_URL" -tAc "SELECT COUNT(*) FROM rodadas" 2>/dev/null || echo 0)"
echo "    agendamentos_manutencao: $("$PSQL" "$PATRIMONIO_URL" -tAc "SELECT COUNT(*) FROM agendamentos_manutencao" 2>/dev/null || echo 0)"
echo ""

# ── 6. Próximos passos ────────────────────────────────────────────────────────

echo "[6/7] Migração de dados concluída com sucesso."
echo ""
echo "  PRÓXIMOS PASSOS:"
echo ""
echo "  1. Testar em desenvolvimento apontando para os bancos novos do RDS:"
echo ""
echo "     FeedbackForms — backend/.env:"
echo "       DB_DATABASE=Pesquisa_Satisfacao_Paciente_DB"
echo "       AUTH_DB_DATABASE=Autenticacao_DB"
echo ""
echo "     LinenSistem — .env:"
echo "       DB_DATABASE=Patrimonio_API_Trilogo_DB"
echo "       AUTH_DB_DATABASE=Autenticacao_DB"
echo ""
echo "  2. Validar:"
echo "     - Login funciona"
echo "     - Formulários carregam"
echo "     - Treinamentos carregam"
echo "     - Rondas e agendamentos carregam"
echo ""
echo "  3. Após validação → cutover de produção:"
echo "     - Atualizar .env.prod com novos nomes de banco"
echo "     - Deploy (~5 min downtime)"
echo ""
echo "  4. Multi_UnidadesDB e dbpgpesquisamkt: manter intactos por 30 dias"
echo ""

echo "[7/7] Script finalizado: $(date '+%Y-%m-%d %H:%M:%S')"
