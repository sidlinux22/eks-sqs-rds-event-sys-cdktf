import { Construct } from 'constructs';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';

import { applicationName } from '../common/awsContants';

// Define the configuration for the network stack
export interface NetworkStackConfig {
  environment: string;
  appName?: string;
  region: string;
  service: string;
  vpcCidrBlock: string;
  subnetPvtCidrA: string;
  subnetPvtCidrB: string;
  subnetPubCidrA: string;
  subnetPubCidrB: string;
}

// Define the AWS network stack
export class AwsNetworkStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: NetworkStackConfig) {
    super(scope, name);

    // Create AWS provider
    new AwsProvider(this, 'aws', {
      region: config.region,
    });

    // Set up remote state storage with S3 backend
    new S3Backend(this, {
      bucket: `${config.environment}-event-sys-tfstate`,
      key: "awsNetworkStack-cdktf",
      region: config.region,
    });

    // Create VPC
    const awsVpc = new Vpc(this, `${config.environment}-${applicationName}-${config.service}-vpc`, {
      cidrBlock: config.vpcCidrBlock,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        Name: `${config.environment}-${applicationName}-${config.service}-vpc`,
      },
    });

    // Output the VPC ID
    new TerraformOutput(this, 'vpc_id', {
      value: awsVpc.id,
    });

    // Create Private Subnets
    const privateSubnetIds: string[] = [];
    const privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const privateSubnet = new Subnet(this, `${config.environment}-${applicationName}-${config.service}-private-subnet-${i + 1}`, {
        availabilityZone: `ap-northeast-1${i % 2 === 0 ? 'a' : 'd'}`,
        vpcId: awsVpc.id,
        mapPublicIpOnLaunch: false,
        cidrBlock: i % 2 === 0 ? config.subnetPvtCidrA : config.subnetPvtCidrB,
        tags: {
          Name: `${config.environment}-${applicationName}-${config.service}-private-subnet-${i + 1}`,
        },
      });
      privateSubnets.push(privateSubnet);
      privateSubnetIds.push(privateSubnet.id);
    }

    // Output the IDs of private subnets
    new TerraformOutput(this, 'privateSubnets_id', {
      value: privateSubnetIds,
    });

    // Create Public Subnets
    const publicSubnetIds: string[] = [];
    const publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const publicSubnet = new Subnet(this, `${config.environment}-${applicationName}-${config.service}-public-subnet-${i + 1}`, {
        availabilityZone: `ap-northeast-1${i % 2 === 0 ? 'a' : 'd'}`,
        vpcId: awsVpc.id,
        mapPublicIpOnLaunch: true,
        cidrBlock: i % 2 === 0 ? config.subnetPubCidrA : config.subnetPubCidrB,
        tags: {
          Name: `${config.environment}-${applicationName}-${config.service}-public-subnet-${i + 1}`,
        },
      });
      publicSubnets.push(publicSubnet);
      publicSubnetIds.push(publicSubnet.id);
    }

    // Output the IDs of public subnets
    new TerraformOutput(this, 'publicSubnets_id', {
      value: publicSubnetIds,
    });

    // Create Internet Gateway
    const internetGateway = new InternetGateway(this, `${config.environment}-${applicationName}-${config.service}-igw`, {
      vpcId: awsVpc.id,
      tags: {
        Name: `${config.environment}-${applicationName}-${config.service}-igw`,
      },
    });

    // Create Elastic IPs and NAT Gateways
    const natGateways = [];
    for (let i = 0; i < 2; i++) {
      const eip = new Eip(this, `${config.environment}-${applicationName}-${config.service}-eip-${i + 1}`, {
        domain: 'vpc',
        tags: {
          Name: `${config.environment}-${applicationName}-${config.service}-eip-${i + 1}`,
        },
      });

      const natGateway = new NatGateway(this, `${config.environment}-${applicationName}-${config.service}-ngw-${i + 1}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `${config.environment}-${applicationName}-${config.service}-ngw-${i + 1}`,
        },
      });

      natGateways.push(natGateway);
    }

    // Create Routing Table for Public Subnets
    const publicRouteTable = new RouteTable(this, `${config.environment}-${applicationName}-${config.service}-pub-rt`, {
      vpcId: awsVpc.id,
      tags: {
        Name: `${config.environment}-${applicationName}-${config.service}-pub-rt`,
      },
    });

    // Define a default route for public subnets
    new Route(this, `${config.environment}-${applicationName}-${config.service}-pub-route`, {
      destinationCidrBlock: '0.0.0.0/0',
      routeTableId: publicRouteTable.id,
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with the public route table
    for (let i = 0; i < 2; i++) {
      new RouteTableAssociation(this, `${config.environment}-${applicationName}-${config.service}-pub-rt-association-${i + 1}`, {
        routeTableId: publicRouteTable.id,
        subnetId: publicSubnets[i].id,
      });

      // Associate NAT Gateways with Private Route Tables
      const privateRouteTable = new RouteTable(this, `${config.environment}-${applicationName}-${config.service}-private-rt-${i + 1}`, {
        vpcId: awsVpc.id,
        tags: {
          Name: `${config.environment}-${applicationName}-${config.service}-private-rt-${i + 1}`,
        },
      });

      // Define a route for private subnets to use NAT Gateways
      new Route(this, `private-subnet-nat-route-${i + 1}`, {
        destinationCidrBlock: '0.0.0.0/0',
        routeTableId: privateRouteTable.id,
        natGatewayId: natGateways[i].id,
      });

      // Associate private subnets with their respective private route tables
      new RouteTableAssociation(this, `private-subnet-rt-association-${i + 1}`, {
        routeTableId: privateRouteTable.id,
        subnetId: privateSubnets[i].id,
      });
    }
  }
}
