# Deployment Guide — FeedbackForms

Full stack deploy: **ECS Fargate** (backend) + **S3/CloudFront** (frontend) + **Route 53** (DNS) + **ACM** (SSL).

---

## Prerequisites

1. **AWS Account** — https://aws.amazon.com/free/
2. **AWS CLI** — https://aws.amazon.com/cli/
3. **Docker Desktop** — https://www.docker.com/products/docker-desktop/
4. **Node.js 20+** — already installed

### Configure AWS CLI

```bash
aws configure
```

Enter your IAM user credentials:
- Access Key ID
- Secret Access Key
- Region: `sa-east-1` (São Paulo)
- Output: `json`

Verify:
```bash
aws sts get-caller-identity
```

---

## Step 1 — Update domain name

Edit `infra/bin/app.ts` and replace:

```ts
domainName: "REPLACE_WITH_YOUR_DOMAIN.com",
```

with your actual domain purchased on GoDaddy.

---

## Step 2 — Deploy infrastructure

```bash
bash scripts/deploy-infra.sh
```

This creates: VPC, ECS Cluster, ECR, ALB, Route 53 Hosted Zone, ACM Certificates, S3 Bucket, CloudFront Distribution.

**After deploy, copy the NameServers from the output.**

---

## Step 3 — Configure GoDaddy DNS

1. Go to GoDaddy → My Domains → your domain → DNS Management
2. Change **Nameservers** to **Custom**
3. Add the 4 nameservers from Step 2 output
4. Wait for propagation (~24-48h, usually faster)

---

## Step 4 — Deploy backend

```bash
bash scripts/deploy-backend.sh
```

This builds the Docker image, pushes to ECR, and triggers ECS deployment.

---

## Step 5 — Deploy frontend

```bash
# Set your API URL
export VITE_API_URL=https://api.YOUR_DOMAIN.com

bash scripts/deploy-frontend.sh
```

This builds the React app and uploads to S3 with CloudFront invalidation.

---

## Architecture

```
                    ┌─────────────────┐
                    │    GoDaddy      │
                    │  (Nameservers)  │
                    └────────┬────────┘
                             │ NS records
                    ┌────────▼────────┐
                    │   Route 53      │
                    │  Hosted Zone    │
                    └──┬──────────┬───┘
                       │          │
          api.domain.com     domain.com
                       │          │
                ┌──────▼──┐  ┌───▼──────────┐
                │   ALB   │  │  CloudFront   │
                │ (HTTPS) │  │   (HTTPS)     │
                └──┬──────┘  └───┬───────────┘
                   │             │
            ┌──────▼──────┐  ┌──▼───┐
            │ ECS Fargate │  │  S3  │
            │  (NestJS)   │  │      │
            └─────────────┘  └──────┘
```

---

## Costs (estimated)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| ECS Fargate (0.25 vCPU, 512MB) | ~$10-15 |
| ALB | ~$16-20 |
| NAT Gateway | ~$32 |
| S3 + CloudFront | ~$1-3 |
| Route 53 | ~$0.50 |
| **Total** | **~$60-70/month** |

> Tip: For lower cost, consider removing the NAT Gateway and using public subnets for Fargate tasks, or switching to EC2 for the backend.
