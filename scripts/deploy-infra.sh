#!/bin/bash
set -e

# ============================================================
# Deploy AWS Infrastructure with CDK
# Usage: ./scripts/deploy-infra.sh
#
# Prerequisites:
#   1. AWS CLI configured (aws configure)
#   2. Docker installed and running
#   3. Node.js installed
#
# First time only:
#   cd infra && npm install && npx cdk bootstrap
# ============================================================

echo "=== Installing CDK dependencies ==="
cd infra
npm install

echo "=== Bootstrapping CDK (first time only, safe to re-run) ==="
npx cdk bootstrap

echo "=== Deploying all stacks ==="
npx cdk deploy --all --require-approval never

echo ""
echo "=== Infrastructure deployed! ==="
echo ""
echo "IMPORTANT: Copy the NameServers from the output above"
echo "and set them in GoDaddy -> DNS Management -> Nameservers"
echo ""
echo "Next steps:"
echo "  1. Set nameservers in GoDaddy (wait for DNS propagation ~24-48h)"
echo "  2. Push backend Docker image: ./scripts/deploy-backend.sh"
echo "  3. Build & deploy frontend:   ./scripts/deploy-frontend.sh"
