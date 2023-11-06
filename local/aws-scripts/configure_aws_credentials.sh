#!/bin/bash

# Check if the AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo "AWS CLI is not installed. Please install it and configure AWS credentials manually."
  exit 1
fi

# Prompt the user for AWS Access Key ID and Secret Access Key
read -p "Enter your AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -p "Enter your AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY

# Prompt the user for the default AWS region
read -p "Enter your default AWS region (e.g., ap-northeast-1): " AWS_DEFAULT_REGION
read -p "Enter your AWS Session Token: "  AWS_SESSION_TOKEN

# Prompt the user for the default output format (e.g., json, text, table)
read -p "Enter your default AWS output format (e.g., json, text, table): " AWS_DEFAULT_OUTPUT_FORMAT

# Configure AWS credentials
aws configure set aws_access_key_id "${AWS_ACCESS_KEY_ID}"
aws configure set aws_secret_access_key "${AWS_SECRET_ACCESS_KEY}"
aws configure set default.region "${AWS_DEFAULT_REGION:-ap-northeast-1}"
aws configure set default.aws_session_token "${AWS_SESSION_TOKEN}"
aws configure set default.output "${AWS_DEFAULT_OUTPUT_FORMAT:-json}"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
export AWS_SESSION_TOKEN="${AWS_SESSION_TOKEN}"
export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-ap-northeast-1}"
echo "AWS credentials and configuration set successfully."

