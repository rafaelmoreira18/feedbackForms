import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";

interface BackendStackProps extends cdk.StackProps {
  domainName: string;
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { domainName } = props;
    const apiDomain = `api.${domainName}`;

    // ---- VPC ----
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    // ---- ECR Repository ----
    const repository = new ecr.Repository(this, "BackendRepo", {
      repositoryName: "feedbackforms-backend",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // ---- ECS Cluster ----
    const cluster = new ecs.FargateCluster(this, "Cluster", {
      vpc,
      clusterName: "feedbackforms",
    });

    // ---- Route 53 Hosted Zone ----
    const hostedZone = new route53.HostedZone(this, "HostedZone", {
      zoneName: domainName,
    });

    // ---- ACM Certificate (for ALB, same region) ----
    const certificate = new acm.Certificate(this, "ApiCert", {
      domainName: apiDomain,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // ---- Application Load Balancer ----
    const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
      vpc,
      internetFacing: true,
    });

    // Redirect HTTP -> HTTPS
    alb.addListener("HttpRedirect", {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: "HTTPS",
        port: "443",
        permanent: true,
      }),
    });

    // HTTPS listener
    const httpsListener = alb.addListener("HttpsListener", {
      port: 443,
      certificates: [certificate],
    });

    // ---- Fargate Task Definition ----
    const taskDef = new ecs.FargateTaskDefinition(this, "TaskDef", {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const container = taskDef.addContainer("backend", {
      // First deploy: use a placeholder image. After pushing to ECR, update to:
      // image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      image: ecs.ContainerImage.fromEcrRepository(repository, "latest"),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: "feedbackforms",
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        PORT: "3001",
        JWT_SECRET: "change-this-secret-in-production",
        JWT_EXPIRES_IN: "1d",
        CORS_ORIGINS: `https://${domainName},https://www.${domainName}`,
      },
    });

    container.addPortMappings({ containerPort: 3001 });

    // ---- Fargate Service ----
    const service = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      assignPublicIp: false,
    });

    httpsListener.addTargets("BackendTarget", {
      port: 3001,
      targets: [service],
      healthCheck: {
        path: "/api/auth/login",
        healthyHttpCodes: "401,405",
        interval: cdk.Duration.seconds(30),
      },
    });

    // ---- DNS Record: api.domain.com -> ALB ----
    new route53.ARecord(this, "ApiAliasRecord", {
      zone: hostedZone,
      recordName: apiDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb)
      ),
    });

    this.apiUrl = `https://${apiDomain}`;

    // ---- Outputs ----
    new cdk.CfnOutput(this, "EcrRepoUri", {
      value: repository.repositoryUri,
      description: "ECR repository URI — push your Docker image here",
    });

    new cdk.CfnOutput(this, "AlbDns", {
      value: alb.loadBalancerDnsName,
      description: "ALB DNS name (use for testing before domain setup)",
    });

    new cdk.CfnOutput(this, "ApiEndpoint", {
      value: this.apiUrl,
      description: "API endpoint (after domain is configured)",
    });

    new cdk.CfnOutput(this, "NameServers", {
      value: cdk.Fn.join(", ", hostedZone.hostedZoneNameServers!),
      description:
        "Set these as nameservers in GoDaddy to delegate DNS to Route 53",
    });
  }
}
