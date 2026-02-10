#!/bin/bash
set -e

# ============================================================
# Deploy Backend to ECS Fargate
# Usage: ./scripts/deploy-backend.sh
# ============================================================

REGION="sa-east-1"
REPO_NAME="feedbackforms-backend"
CLUSTER_NAME="feedbackforms"
SERVICE_NAME=$(aws ecs list-services --cluster "$CLUSTER_NAME" --region "$REGION" --query "serviceArns[0]" --output text | xargs -I{} basename {})

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME"

echo "=== Building Docker image ==="
cd backend
docker build -t "$REPO_NAME" .

echo "=== Logging into ECR ==="
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

echo "=== Tagging and pushing image ==="
docker tag "$REPO_NAME:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"

echo "=== Forcing new ECS deployment ==="
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --force-new-deployment \
  --region "$REGION"

echo "=== Done! Backend deployment triggered ==="
echo "Monitor at: https://$REGION.console.aws.amazon.com/ecs/v2/clusters/$CLUSTER_NAME/services"
