import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";

interface FrontendStackProps extends cdk.StackProps {
  domainName: string;
  apiUrl: string;
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { domainName } = props;

    // ---- S3 Bucket for static files ----
    const bucket = new s3.Bucket(this, "FrontendBucket", {
      bucketName: `${domainName}-frontend`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // ---- Route 53 Hosted Zone (lookup the one created in backend stack) ----
    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName,
    });

    // ---- ACM Certificate (must be in us-east-1 for CloudFront) ----
    const certificate = new acm.Certificate(this, "FrontendCert", {
      domainName,
      subjectAlternativeNames: [`www.${domainName}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // ---- CloudFront Distribution ----
    const distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: [domainName, `www.${domainName}`],
      certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // ---- DNS Records: domain.com + www.domain.com -> CloudFront ----
    new route53.ARecord(this, "SiteAliasRecord", {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    new route53.ARecord(this, "WwwAliasRecord", {
      zone: hostedZone,
      recordName: `www.${domainName}`,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
    });

    // ---- Deploy frontend build to S3 ----
    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "../../dist")),
      ],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // ---- Outputs ----
    new cdk.CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront URL (use for testing before domain setup)",
    });

    new cdk.CfnOutput(this, "SiteUrl", {
      value: `https://${domainName}`,
      description: "Site URL (after domain is configured)",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
      description: "S3 bucket name for frontend files",
    });
  }
}
