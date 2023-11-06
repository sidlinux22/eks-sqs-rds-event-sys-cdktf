import { Construct } from "constructs";
import { DataTerraformRemoteStateS3, Fn, S3Backend, TerraformOutput, TerraformStack } from "cdktf";
import { DataAwsEksCluster } from "@cdktf/provider-aws/lib/data-aws-eks-cluster";
import { DataAwsEksClusterAuth } from "@cdktf/provider-aws/lib/data-aws-eks-cluster-auth";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { KubernetesProvider } from "@cdktf/provider-kubernetes/lib/provider";
import { Eks } from "../../.gen/modules/terraform-aws-modules/aws/eks";
import { ConfigMap } from "@cdktf/provider-kubernetes/lib/config-map";

export interface EksStackConfig {
  environment: string;
  appName?: string;
  region: string;
  clusterName: string;
  service: string;
}

export class EksClusterStackModule extends TerraformStack {
  eks: DataAwsEksCluster;
  eksAuth: DataAwsEksClusterAuth;
  constructor(scope: Construct, name: string, config: EksStackConfig) {
    super(scope, name);

    // Create AWS Provider
    new AwsProvider(this, "aws", {
      region: config.region,
    });

    // Set up S3 Backend for state storage
    new S3Backend(this, {
      bucket: `${config.environment}-event-sys-tfstate`,
      key: "awsEks-cdktf",
      region: config.region,
    });

    // Retrieve VPC information from remote state
    const vpcRemoteData = new DataTerraformRemoteStateS3(this, "vpcRemoteData", {
      bucket: `${config.environment}-event-sys-tfstate`,
      key: "awsNetworkStack-cdktf",
      region: "ap-northeast-1",
    });

    // Security roles
    const mgmtOne = new SecurityGroup(this, "worker_group_mgmt_one", {
      namePrefix: "worker_group_mgmt_one",
      vpcId: vpcRemoteData.getString("vpc_id"),
    });

    const mgmtTwo = new SecurityGroup(this, "worker_group_mgmt_two", {
      namePrefix: "worker_group_mgmt_two",
      vpcId: vpcRemoteData.getString("vpc_id"),
    });

    new SecurityGroup(this, "all_worker_mgmt", {
      namePrefix: "all_worker_mgmt",
      vpcId: vpcRemoteData.getString("vpc_id"),
    });

    const clusterName = config.clusterName;

    // Create EKS cluster
    const eksModule = new Eks(this, "eks", {
      clusterName,
      clusterVersion: "1.28",
      manageAwsAuth: false,
      subnets: vpcRemoteData.getList("privateSubnets_id"),
      vpcId: vpcRemoteData.getString("vpc_id"),

      workersGroupDefaults: {
        rootVolumeType: "gp2",
      },

      workerGroups: [
        {
          name: "worker-group-1",
          instanceType: "t2.small",
          additionalUserdata: "echo foo bar",
          asgDesiredCapacity: 2,
          additionalSecurityGroupIds: [mgmtOne.id],
        },
        {
          name: "worker-group-2",
          instanceType: "t2.medium",
          additionalUserdata: "echo foo bar",
          additionalSecurityGroupIds: [mgmtTwo.id],
          asgDesiredCapacity: 1,
        },
      ],

      tags: {
        githubRepo: "hashicorp/terraform-cdk",
      },
    });

    // Output the IAM role name
    new TerraformOutput(this, 'eks_IamRoleName', {
      value: eksModule.clusterIamRoleArnOutput
    });

    this.eks = new DataAwsEksCluster(this, "eks-cluster", {
      name: eksModule.clusterIdOutput,
    });

    this.eksAuth = new DataAwsEksClusterAuth(this, "eks-auth", {
      name: eksModule.clusterIdOutput,
    });
  }
}

export class KubernetesApplicationStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    environment: string,
    cluster: DataAwsEksCluster,
    clusterAuth: DataAwsEksClusterAuth,
  ) {
    super(scope, id);

    // Retrieve EKS remote data
    const eksRemoteData = new DataTerraformRemoteStateS3(this, "vpcRemoteData", {
      bucket: `${environment}-event-sys-tfstate`,
      key: "awsEks-cdktf",
      region: "ap-northeast-1",
    });

    // Create Kubernetes provider
    new KubernetesProvider(this, "cluster", {
      host: cluster.endpoint,
      clusterCaCertificate: Fn.base64decode(
        cluster.certificateAuthority.get(0).data
      ),
      token: clusterAuth.token,
    });

    // Access EKS IAM role name from remote data
    const eksIamRoleName = eksRemoteData.getString("eks_IamRoleName");
    
    // Define the ConfigMap YAML
    const configMapYAML = `
    |
    - groups:
      - system:bootstrappers
      - system:nodes
      rolearn: ${eksIamRoleName}
      username: system:node:{{EC2PrivateDNSName}}
    `;

    // Create the Kubernetes ConfigMap
    new ConfigMap(this, 'aws-auth', {
      metadata: {
        name: 'aws-auth',
        namespace: 'kube-system',
      },
      data: {
        mapRoles: configMapYAML,
      },
    });
  }
}
