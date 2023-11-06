import { App } from "cdktf";
import { defaultRegion } from "./stacks/common/awsContants";
import { AwsNetworkStack } from "./stacks/network/awsVpcStack";

const app = new App();

// 1 VPC resources and networking 
new AwsNetworkStack(app, "dev-network-stacks-ap", {
  environment: "dev",
  service: "net",
  region: defaultRegion,
  vpcCidrBlock: "192.168.0.0/16",
  subnetPvtCidrA: "192.168.0.0/18",
  subnetPvtCidrB: "192.168.64.0/18",
  subnetPubCidrA: "192.168.128.0/18",
  subnetPubCidrB: "192.168.192.0/18",
});


app.synth();

