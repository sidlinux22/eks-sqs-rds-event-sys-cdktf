import { Construct } from 'constructs';
import { S3Backend, TerraformStack } from 'cdktf';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

import { applicationName } from '../common/awsContants';


export interface SqsStackConfig {
    environment: string;
    service: string;
    region: string;
  }

export class AwsSqsStack extends TerraformStack {
        constructor(scope: Construct, id: string, config: SqsStackConfig) {
          super(scope, id);
    // Define the AWS provider
    new AwsProvider(this, 'aws', {
        region: config.region,
      });

      new S3Backend(this, {
        bucket: `${config.environment}-event-sys-tfstate`,
        key: "awsSqsStack-cdktf",
        region: config.region,
      });
  


    // Create an SQS queue
    new SqsQueue(this, `${config.environment}-${applicationName}-sqs`, {
      name:  `${config.environment}-${applicationName}`,
      visibilityTimeoutSeconds: 30,
      delaySeconds: 0,
      messageRetentionSeconds: 86400,
      maxMessageSize: 262144,
      receiveWaitTimeSeconds: 10,
      fifoQueue: false, // Set to true for FIFO queues
    });
  }
}