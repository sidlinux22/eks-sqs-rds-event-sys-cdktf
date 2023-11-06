
# eks-sqs-rds-event-sys-cdktf

  

  

This repository leverages Terraform's CDK for Terraform (cdktf) to manage various AWS resources, including an EKS cluster, RDS database, SQS queues, and more. It also includes a configuration for an Ingress Controller and a sample app deployment on the EKS cluster.

  

## Table of Contents

- [eks-sqs-rds-event-sys-cdktf](#eks-sqs-rds-event-sys-cdktf)
  - [Table of Contents](#table-of-contents)
  - [Repository Structure](#repository-structure)
    - [Prerequisites](#prerequisites)
    - [Local Setup with Docker](#local-setup-with-docker)
    - [Docker Compose Details](#docker-compose-details)
  - [Usage](#usage)


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


> **cdktf-get**: Run 'cdktf get' in the Docker container.
> 
> **npm-install**: Run 'npm install' in the Docker container.
> 
> **cdktf-list**: Run 'cdktf list' in the Docker container.
> 
> **deploy-network**: Deploy the network stack.
> 
> **deploy-db**: Deploy the database stack.
> 
> **deploy-eks**: Deploy the EKS stack.
> 
> **deploy-sqs**: Deploy the SQS stack.
> 
> **configure-aws-credentials**: Configure AWS credentials.
> 
> **configure-k8s-credentials**: Configure AWS credentials for Kubernetes.
> 
> **create-s3-bucket**: Create an S3 bucket.
> 
> **setup-ingress-controller**: Setup the AWS Load Balancer Controller.
> 
> **run-all-stacks**: Run all CDKTerraform stacks in sequence.
> 
> **destroy-eks**: Destroy the EKS stack.
> 
> **run-all-cleanup**: Cleanup all resources.
> 
> **run-sample-app**: Create the sample app deployment, service, and Ingress.


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