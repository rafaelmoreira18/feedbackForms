#!/bin/bash
# Deploy backend without Docker
# Run this script on the server from the project root (feedbackforms/)
# Requirements: Node.js 20+, git

set -e

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Installing dependencies ==="
cd backend
npm ci

echo "=== Building ==="
rm -f tsconfig.tsbuildinfo
npm run build

echo "=== Creating .env ==="
cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
JWT_SECRET=MediallMkt-jwt-secret-2026-prod
JWT_EXPIRES_IN=1d
DB_HOST=dbpgpesquisamkt.ce6ipyxrb0gc.sa-east-1.rds.amazonaws.com
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=MediallMkt2026
DB_DATABASE=feedbackforms
DB_SYNCHRONIZE=false
DB_SSL=true
EOF

echo "=== Starting with pm2 ==="
# Install pm2 globally if not present
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

# Stop existing instance if running
pm2 delete feedbackforms-api 2>/dev/null || true

pm2 start dist/main.js --name feedbackforms-api
pm2 save

echo "=== Done! Backend running on port 3001 ==="
pm2 status feedbackforms-api
