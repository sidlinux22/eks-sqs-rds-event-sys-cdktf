
# eks-sqs-rds-event-sys-cdktf

This repository leverages Terraform's CDK for Terraform (cdktf) to manage various AWS resources, including an EKS cluster, RDS database, SQS queues, and more. It also includes a configuration for an Ingress Controller and a sample app deployment on the EKS cluster.

## Architecture

<img src="https://raw.githubusercontent.com/sidlinux22/eks-sqs-rds-event-sys-cdktf/master/docs/infra_Architecture.jpeg" width="400">
  

## Table of Contents

- [eks-sqs-rds-event-sys-cdktf](#eks-sqs-rds-event-sys-cdktf)
  - [Architecture](#architecture)
  - [Table of Contents](#table-of-contents)
  - [Repository Structure](#repository-structure)
    - [Prerequisites](#prerequisites)
    - [Local Setup with Docker](#local-setup-with-docker)
    - [Docker Compose Details](#docker-compose-details)
  - [Usage](#usage)
  - [CDK for Terraform (cdktf) Stacks](#cdk-for-terraform-cdktf-stacks)
    - [Stack Communication](#stack-communication)
  - [Application Deployment on EKS](#application-deployment-on-eks)
    - [AWS Ingress Controller](#aws-ingress-controller)
    - [Sample App: echoserver](#sample-app-echoserver)
  - [Troubleshooting Issues](#troubleshooting-issues)
    - [1. Expired Token Error](#1-expired-token-error)
    - [2. Backend Configuration Changed](#2-backend-configuration-changed)
  - [References and Resources](#references-and-resources)


## Repository Structure

The repository is organized into the following directories:

-  **stacks**: Contains different CDKTerraform stacks, each responsible for specific AWS resource management.
-  **common**: Contains common AWS constants and configurations.
-  **compute**: Manages the AWS EKS (Elastic Kubernetes Service) stack.  
-  **data**: Manages the AWS RDS (Relational Database Service) and AWS SQS (Simple Queue Service) stacks.
-  **network**: Manages the AWS VPC (Virtual Private Cloud) stack, including subnets and NAT gateways.

-  **service**: Contains Kubernetes manifests for a sample app and Ingress Controller setup.

-  **echoserver**: Contains Kubernetes manifests for the sample app deployment, service, namespace, and Ingress resource.

-  **ingress-controller**: Contains an IAM policy and a setup script for configuring the AWS Load Balancer Controller.

-  **Taskfile.yml**: Defines a set of tasks to facilitate the management of AWS resources and Kubernetes deployments.
- 

### Prerequisites

Before using this repository, make sure you have the following prerequisites installed:

- [Docker](https://www.docker.com/get-started)

- [Task](https://taskfile.dev/#/installation)

- AWS CLI installed and configured with appropriate permissions.

### Local Setup with Docker

1. Clone the repository:
```bash
git  clone  https://github.com/sidlinux22/eks-sqs-rds-event-sys-cdktf.git
```
2. Create an `.env` file with your AWS credentials. You can use your AWS Access Key ID, AWS Secret Access Key, and AWS Session Token (if applicable). Update the `.env` file with your credentials.

```bash
AWS_ACCESS_KEY_ID=<YourAccessKey>
AWS_SECRET_ACCESS_KEY=<YourSecretKey>
AWS_SESSION_TOKEN=<YourSessionToken>
```

3. Build and run the Docker container using Docker Compose:
```bash
docker-compose  up  -d
```
This Docker container is configured with the necessary tools and dependencies.

4. Access the Docker container:
```bash
docker  exec  -it  event-sys-cdktf  /bin/bash
```

### Docker Compose Details

The Docker Compose file (`docker-compose.yml`) configures a Docker container for the CDKTerraform setup. Here are the key points:

-  `cdktf` service: Builds the Docker container with the specified Dockerfile and sets up the necessary tools and environment.
- Volumes are mounted to share project files and AWS credentials with the container.
- Environment variables are configured for AWS credentials, which are loaded from the `.env` file.
This Docker Compose setup provides an isolated environment with all the tools and dependencies required for CDKTerraform.
To use these tools and tasks within the Docker container, refer to the "Usage" section in the README for information on running various tasks and managing AWS resources.

  
## Usage

You can use the following tasks defined in the `Taskfile.yml` to manage the AWS resources and deploy the sample app:

task: Available tasks for this project:


| Command Name                | Description                                       |
| --------------------------- | ------------------------------------------------- |
| cdktf-get                   | Run 'cdktf get' in the Docker container.         |
| npm-install                 | Run 'npm install' in the Docker container.       |
| cdktf-list                  | Run 'cdktf list' in the Docker container.        |
| deploy-network              | Deploy the network stack.                        |
| deploy-db                   | Deploy the database stack.                       |
| deploy-eks                  | Deploy the EKS stack.                            |
| deploy-sqs                  | Deploy the SQS stack.                            |
| configure-aws-credentials   | Configure AWS credentials.                        |
| configure-k8s-credentials   | Configure AWS credentials for Kubernetes.         |
| create-s3-bucket            | Create an S3 bucket.                             |
| setup-ingress-controller    | Setup the AWS Load Balancer Controller.          |
| run-all-stacks              | Run all CDKTerraform stacks in sequence.        |
| destroy-eks                | Destroy the EKS stack.                           |
| run-all-cleanup             | Cleanup all resources.                           |
| run-sample-app              | Create the sample app deployment, service, and Ingress. |


**Example:**

To Configure AWS credentials. you can run the following commands:

```
task configure-aws-credentials
```
To Deploy and setup VCP. you can run the following commands:

```
task deploy-network
```

To deploy all CDKTerraform stacks and the sample app, you can run the following commands:
```
task run-all-stacks
task run-sample-app
```

## CDK for Terraform (cdktf) Stacks

In this project, we have divided the infrastructure into CDK for Terraform (cdktf) stacks, each organized based on its logical grouping. This separation ensures that these stacks are independent from each other with their own state management using the S3 backend state management, which promotes a modular and consistent approach to managing AWS resources.

### Stack Communication

The CDK for Terraform (cdktf) allows us to share information between stacks. This project is configured to easily pass parameters between environments, ensuring consistency in resource definitions.

 Relationships and S3 state storage for each stack:

**Network Stack:** This stack manages the Virtual Private Cloud (VPC) resources. It exports the VPC configuration and CIDR blocks.
**Data Stack:** This stack manages the RDS database resources. It imports the VPC configuration and exports the RDS database configuration.
**EKS Stack:** This stack manages the Elastic Kubernetes Service (EKS) resources. It imports the VPC configuration and exports the EKS cluster configuration.
**S3 Stack:** This stack represents the S3 backend state management. It imports the S3 bucket configuration and exports nothing.
**Application Stack:** This stack deploys applications using Kubernetes. It imports the EKS cluster configuration and exports the application deployment configuration.

<img src="https://raw.githubusercontent.com/sidlinux22/eks-sqs-rds-event-sys-cdktf/master/docs/tf_state.jpeg" width="400">


## Application Deployment on EKS

In this CDK for Terraform (cdktf) project, we deploy applications on Amazon Elastic Kubernetes Service (EKS). The application deployment is orchestrated with Kubernetes and includes the deployment of the AWS Ingress Controller to handle application traffic routing.

### AWS Ingress Controller

The [AWS Load Balancer Controller](https://github.com/kubernetes-sigs/aws-load-balancer-controller) is deployed as part of this project. It acts as an Ingress Controller in your EKS cluster, providing a bridge between Kubernetes services and external services. This controller manages the creation and configuration of AWS Elastic Load Balancers (ALBs) to route incoming traffic to the appropriate services within the cluster.

Key features of the AWS Ingress Controller include:
- Dynamic creation and management of ALBs based on Kubernetes Ingress resources.
- SSL/TLS termination and certificate management for secure traffic.
- Integration with AWS service discovery for routing to internal services.
- Support for multiple target groups and path-based routing.

### Sample App: echoserver

As a part of the demonstration of ingress routing and AWS Load Balancer Controller, a sample application called "echoserver" is deployed. The echoserver is a simple application that echoes incoming HTTP requests, making it a useful tool for testing and verifying the functionality of Ingress routing.

The echoserver deployment showcases how the Ingress Controller routes traffic from the ALB to the appropriate Kubernetes service, and how it handles requests and responses within the EKS cluster.

This combination of the AWS Ingress Controller and the echoserver app provides a practical example of how to manage and route traffic for your applications in a Kubernetes environment on AWS EKS.

## Troubleshooting Issues

### 1. Expired Token Error

**Issue**: An error occurred (ExpiredTokenException) when calling a specific AWS operation, such as DescribeCluster, and the error message indicates that the security token included in the request is expired.

**Troubleshooting Steps**:
- This error typically occurs when the AWS credentials used by the CDK for Terraform (cdktf) are no longer valid.
- Ensure that your AWS credentials are up to date and have not expired. You can refresh your AWS credentials by running `aws configure` and providing valid Access Key ID and Secret Access Key.
- Check if you have set the correct AWS region in your CDK for Terraform code. Verify that the AWS resources you are trying to manage exist in the specified region.

### 2. Backend Configuration Changed

**Issue**: When running Terraform commands, you encounter the error message "Error: Backend configuration changed."

**Troubleshooting Steps**:
- This error occurs when the backend configuration of the Terraform state has changed, which may require migrating the existing state.
- You can attempt automatic migration of the state by running `terraform init -migrate-state`. This command will help migrate your state to the new backend configuration.
- If you don't want to make any changes to the state and only need to store the current configuration, you can use `terraform init -reconfigure`.

These are some common issues you may encounter while working with CDK for Terraform (cdktf) infrastructure. For specific errors or issues, consult the Terraform documentation and AWS documentation, and consider reviewing the CDK for Terraform (cdktf) project's documentation or community resources for additional troubleshooting guidance.


## References and Resources

Here are some key references and resources that you may find helpful for understanding and working with this CDK for Terraform (cdktf) project:

- [terraform-aws-eks](https://github.com/terraform-aws-modules/terraform-aws-eks)
- [CDK for Terraform (cdktf) Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [Terraform Backend Configuration](https://developer.hashicorp.com/terraform/language/settings/backends/s3)
- [CDK for Terraform (cdktf) Stacks](https://developer.hashicorp.com/terraform/cdktf/concepts/stacks)
- [AWS Load Balancer Controller Documentation](https://kubernetes-sigs.github.io/aws-load-balancer-controller/v1.1/guide/walkthrough/echoserver/)
- [AWS Load Balancer Controller Helm Chart](https://artifacthub.io/packages/helm/aws/aws-load-balancer-controller)