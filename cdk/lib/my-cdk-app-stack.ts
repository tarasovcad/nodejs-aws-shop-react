import * as cdk from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
export class MyCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  create a bucket
    const websiteBucket = new Bucket(this, 'ShopStaticBucket', {
      bucketName: 'aws-react-rs-school',
      publicReadAccess: false,
      // websiteIndexDocument: 'index.html',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    //  create an origin access identity so cloufont can securely read the stuff
    const oai = new cloudfront.OriginAccessIdentity(this, 'MyOAI');
    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [websiteBucket.arnForObjects('*')],
        principals: [
          new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId),
        ],
      }),
    );

    //  create a cloudfront distribution
    const distribution = new cloudfront.Distribution(this, 'MyReactAppDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(websiteBucket, { originAccessIdentity: oai }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });

    //  create a deployment
    new BucketDeployment(this, 'DeployReactApp', {
      sources: [Source.asset('../dist')],
      destinationBucket: websiteBucket,
      distribution: distribution,
      distributionPaths: ['/*'],
    });
    //  output the website url
    new cdk.CfnOutput(this, 'BucketWebsiteURL', {
      value: websiteBucket.bucketWebsiteUrl,
      description: 'The URL for the deployed React app',
    });
    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: distribution.domainName,
      description: 'The URL for the CloudFront distribution',
    });
  }
}
