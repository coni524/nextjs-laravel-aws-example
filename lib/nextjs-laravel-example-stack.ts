import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';

export class LaravelAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'AppCluster', {
      vpc,
      containerInsights: true,
    });

    // RDS Instance
    const databaseCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0
      }),
      vpc,
      credentials: rds.Credentials.fromSecret(databaseCredentials),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      multiAz: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      databaseName: 'laravel_db',
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // Build and push Docker image
    const dockerImage = new DockerImageAsset(this, 'LaravelImage', {
      directory: path.join(__dirname, '../app'),
      file: 'Dockerfile',
      platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,  // x86_64を指定
    });

    // Fargate Service with ALB
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'LaravelService', {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 2,
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(dockerImage),
        containerPort: 80,
        environment: {
          APP_ENV: 'production',
          APP_KEY: 'base64:' + cdk.Fn.base64('32characterslong-application-key'),
          APP_DEBUG: 'false',
          APP_URL: 'http://localhost',
          DB_CONNECTION: 'mysql',
          DB_HOST: database.instanceEndpoint.hostname,
          DB_PORT: '3306',
          DB_DATABASE: 'laravel_db',
          NGINX_PORT: '80',
        },
        secrets: {
          DB_USERNAME: ecs.Secret.fromSecretsManager(databaseCredentials, 'username'),
          DB_PASSWORD: ecs.Secret.fromSecretsManager(databaseCredentials, 'password'),
        },
      },
      publicLoadBalancer: true,
      assignPublicIp: false,
      listenerPort: 80,
    });

    // ターゲットグループのヘルスチェック設定
    fargateService.targetGroup.configureHealthCheck({
      path: '/api/health',
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
      healthyHttpCodes: '200'
    });

    // Allow ECS task to connect to RDS
    database.connections.allowDefaultPortFrom(fargateService.service);

    // // CloudFront Distribution
    // const distribution = new cloudfront.Distribution(this, 'AppDistribution', {
    //   defaultBehavior: {
    //     origin: new origins.LoadBalancerV2Origin(fargateService.loadBalancer, {
    //       protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
    //     }),
    //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    //     cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
    //     cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
    //     originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
    //   },
    //   priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    // });




    // Next.js SSR Service
    const nextjsImage = new DockerImageAsset(this, 'NextjsImage', {
      directory: path.join(__dirname, '../nextjs'),
      file: 'Dockerfile',
      platform: cdk.aws_ecr_assets.Platform.LINUX_AMD64,  // x86_64を指定
    });

    const laravelServiceUrl = `http://${fargateService.loadBalancer.loadBalancerDnsName}`;

    const nextjsService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'NextjsService', {
      cluster,
      cpu: 512,
      memoryLimitMiB: 1024,
      desiredCount: 2,
      taskImageOptions: {
        image: ecs.ContainerImage.fromDockerImageAsset(nextjsImage),
        containerPort: 3000,
        environment: {
          API_URL: laravelServiceUrl,
          NODE_ENV: 'production',
        },
      },
      publicLoadBalancer: true,
    });
    
    // セキュリティグループのルールを追加
    const laravelServiceSg = fargateService.service.connections.securityGroups[0];
    const nextjsServiceSg = nextjsService.service.connections.securityGroups[0];
    
    laravelServiceSg.addIngressRule(
      nextjsServiceSg,
      ec2.Port.tcp(80),
      'Allow Next.js to access Laravel API'
    );

    // S3 Bucket for static content
    const staticBucket = new s3.Bucket(this, 'StaticBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Deploy static content to S3
    new s3deploy.BucketDeployment(this, 'StaticDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../nextjs/out'))],
      destinationBucket: staticBucket,
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'AppDistribution', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(nextjsService.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.LoadBalancerV2Origin(fargateService.loadBalancer, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
          originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
        }
      },
    });


    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
    });


  }
}