#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BackendStack } from "../lib/backend-stack";
import { FrontendStack } from "../lib/frontend-stack";

// ============================================================
// CONFIGURATION — Update these values before deploying
// ============================================================
const config = {
  // Replace with your domain after purchasing on GoDaddy
  // Example: "feedbackforms.com.br" or "meusite.com"
  domainName: "REPLACE_WITH_YOUR_DOMAIN.com",

  // AWS region — sa-east-1 = São Paulo
  region: "sa-east-1",

  // Your AWS account ID (run: aws sts get-caller-identity)
  account: process.env.CDK_DEFAULT_ACCOUNT,
};
// ============================================================

const app = new cdk.App();

const env = { account: config.account, region: config.region };

// We need a separate env for us-east-1 because CloudFront
// requires ACM certificates to be in us-east-1
const usEast1Env = { account: config.account, region: "us-east-1" };

const backend = new BackendStack(app, "FeedbackForms-Backend", {
  env,
  domainName: config.domainName,
});

new FrontendStack(app, "FeedbackForms-Frontend", {
  env: usEast1Env,
  crossRegionReferences: true,
  domainName: config.domainName,
  apiUrl: `https://api.${config.domainName}`,
});
