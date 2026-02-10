#!/bin/bash
set -e

# ============================================================
# Deploy Frontend to S3 + CloudFront
# Usage: ./scripts/deploy-frontend.sh
#
# Before running, set your API URL:
#   export VITE_API_URL=https://api.YOUR_DOMAIN.com
# ============================================================

REGION="us-east-1"

echo "=== Building frontend ==="
npm run build

# Get bucket name and distribution ID from CloudFormation outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name "FeedbackForms-Frontend" \
  --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?Id=='S3Origin' || contains(DomainName, '$BUCKET_NAME')]].Id" \
  --output text)

echo "=== Uploading to S3: $BUCKET_NAME ==="
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete --region "$REGION"

if [ -n "$DISTRIBUTION_ID" ]; then
  echo "=== Invalidating CloudFront cache: $DISTRIBUTION_ID ==="
  aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*"
fi

echo "=== Done! Frontend deployed ==="
