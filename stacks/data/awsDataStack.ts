import { Construct } from 'constructs';
import {
  DataTerraformRemoteStateS3,
  S3Backend,
  TerraformStack,
} from 'cdktf';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

// Constants and common configurations
import { applicationName, devDbPassword } from '../common/awsContants';

export interface RdsStackConfig {
  domainCertArn?: string;
  environment: string;
  service: string;
  region: string;
  appType?: string;
  multiAz?: boolean;
  instanceClass: string;
}

export class AwsDataStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: RdsStackConfig) {
    super(scope, id);

    // Create an AWS Provider
    new AwsProvider(this, 'aws', {
      region: config.region,
    });

    // Set up S3 Backend for state storage
    new S3Backend(this, {
      bucket: `${config.environment}-event-sys-tfstate`,
      key: 'awsRdsStack-cdktf',
      region: config.region,
    });

    // Define a resource name
    const nameResource = `${config.environment}-${applicationName}-${config.service}`;
    
    // Retrieve the RDS password from SSM Parameter Store
    const rdsPassword = new SsmParameter(this, `${nameResource}-ssm-param`, {
      name: `${nameResource}-db`,
      type: 'String',
      value: devDbPassword,
    });

    // Retrieve VPC information from remote state
    const vpcRemoteData = new DataTerraformRemoteStateS3(this, 'vpcRemoteData', {
      bucket: `${config.environment}-event-sys-tfstate`,
      key: 'awsNetworkStack-cdktf',
      region: 'ap-northeast-1',
    });

    // Create a security group for RDS using subnet data from the remote state
    const dataRemoteDbSecurity = new DbSubnetGroup(this, `${nameResource}-db-security`, {
      name: `${nameResource}-db-security`,
      subnetIds: vpcRemoteData.getList('privateSubnets_id'),
    });

    // Create an RDS database instance
    new DbInstance(this, `${nameResource}-db`, {
      identifier: `${nameResource}-db`,
      engine: 'postgres',
      engineVersion: "14",
      instanceClass: config.instanceClass,
      multiAz: config.multiAz,
      allocatedStorage: 120,
      username: 'devadmin',
      password: rdsPassword.value,
      dbSubnetGroupName: dataRemoteDbSecurity.name,
      availabilityZone: 'ap-northeast-1a',
      deletionProtection: false,
      maintenanceWindow: 'Mon:00:00-Mon:03:00',
      backupWindow: '03:00-06:00',
      backupRetentionPeriod: 7,
      skipFinalSnapshot: true,
      allowMajorVersionUpgrade: true,
      publiclyAccessible: false,
    });
  }
}