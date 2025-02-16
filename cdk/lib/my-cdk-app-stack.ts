import * as cdk from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

import { Construct } from 'constructs';
export class MyCdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //  create a bucket
    const websiteBucket = new Bucket(this, 'ShopStaticBucket', {
      bucketName: 'aws-react-rs-school',
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
    });

    //  create a cloudfront distribution
    const distribution = new Distribution(this, 'SiteDistribution', {
      defaultBehavior: {
        origin: new S3Origin(websiteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
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
