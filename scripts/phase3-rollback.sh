#!/usr/bin/env bash
# =============================================================================
# Phase 3 — Rollback Script
# Use se algo quebrar após a migração.
# Tempo estimado de rollback: ~5 minutos.
#
# O que este script faz:
#   - NÃO destrói nada — apenas orienta os passos manuais
#   - O banco Multi_UnidadesDB original nunca foi modificado
#
# Usage:
#   bash scripts/phase3-rollback.sh
# =============================================================================

echo ""
echo "============================================================"
echo "  Phase 3 — ROLLBACK"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================================"
echo ""
echo "  O banco Multi_UnidadesDB NÃO foi modificado durante a migração."
echo "  Para reverter, siga os passos abaixo:"
echo ""
echo "  1. Habilite manutenção no app (retornar 503)"
echo ""
echo "  2. Reverta o .env.prod no servidor para apontar ao banco original:"
echo "     DB_DATABASE=Multi_UnidadesDB"
echo "     AUTH_DB_DATABASE=Multi_UnidadesDB"
echo "     (ambos no mesmo host de antes)"
echo ""
echo "  3. Deploy do código anterior (git revert ou redeploy da versão estável)"
echo ""
echo "  4. Tire o app de manutenção"
echo ""
echo "  5. Verifique:"
echo "     - Login funciona"
echo "     - Formulários carregam"
echo "     - Treinamentos carregam"
echo ""
echo "  IMPORTANTE: NÃO drope auth_db nem feedbackforms_db ainda."
echo "  Investigue a causa do problema antes de qualquer ação destrutiva."
echo ""
