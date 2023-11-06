#!/bin/bash

# Add Helm repository
helm repo add eks https://aws.github.io/eks-charts

# Install AWS Load Balancer Controller using Helm
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    --set clusterName=dev-eks-cluster -n kube-system \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller

# Setup IAM for ServiceAccount
# Create IAM OIDC provider
eksctl utils associate-iam-oidc-provider --region "ap-northeast-1"  --cluster "dev-eks-cluster" --approve

# Create an IAM policy called AWSLoadBalancerControllerIAMPolicy
aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document ./iam-policy.json
POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`AWSLoadBalancerControllerIAMPolicy`].Arn' --output text)
# Take note of the policy ARN that is returned
echo "AWS Load Balancer Controller IAM Policy ARN: ${POLICY_ARN}"

# Create an IAM role and ServiceAccount for the Load Balancer controller
# Use the ARN from the step above
eksctl create iamserviceaccount \
    --cluster=dev-eks-cluster \
    --namespace=kube-system \
    --name=aws-load-balancer-controller \
    --attach-policy-arn=${POLICY_ARN} \
    --approve

echo "AWS Load Balancer Controller IAM role and ServiceAccount created."