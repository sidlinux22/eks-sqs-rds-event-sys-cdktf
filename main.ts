import { App } from "cdktf";
import { AwsDataStack } from "./stacks/data/awsDataStack";
import { AwsNetworkStack } from "./stacks/network/awsVpcStack";
import { defaultRegion } from "./stacks/common/awsContants";


const app = new App();


// 1. VPC resources and networking
const vpcConfig = {
  environment: "dev",
  service: "net", // Service name for networking stack
  region: defaultRegion,
  vpcCidrBlock: "192.168.0.0/16",// CIDR block for the VPC
  subnetPvtCidrA: "192.168.0.0/18",  // CIDR block for private subnet A
  subnetPvtCidrB: "192.168.64.0/18", // CIDR block for private subnet B
  subnetPubCidrA: "192.168.128.0/18", // CIDR block for public subnet A
  subnetPubCidrB: "192.168.192.0/18", // CIDR block for public subnet B
};

// Create the AWSNetworkStack using the defined configuration
new AwsNetworkStack(app, 'dev-network-stacks-ap', vpcConfig);

// 2. Data and database
const dataConfig = {
  environment: "dev",
  service: 'rds',  // Service name for RDS
  instanceClass: 'db.t3.micro',  // RDS instance class
  multiAz: false,  // Multi-AZ setting
  region: defaultRegion,  // Specific AWS region
};

// Create the AWSDataStack using the defined configuration
new AwsDataStack(app, 'dev-data-db-stacks-ap', dataConfig);

app.synth();