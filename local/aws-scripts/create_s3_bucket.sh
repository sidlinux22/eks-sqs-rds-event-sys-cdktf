#!/bin/bash

# Check if the AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo "AWS CLI is not installed."

  # Determine the OS platform
  if [[ "$(uname -s)" == "Linux" ]]; then
    # Install AWS CLI on Linux
    echo "Installing AWS CLI on Linux..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
  elif [[ "$(uname -s)" == "Darwin" ]]; then
    # Install AWS CLI on macOS
    echo "Installing AWS CLI on macOS..."
    curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
    sudo installer -pkg AWSCLIV2.pkg -target /
    rm -f AWSCLIV2.pkg
  else
    echo "Unsupported operating system."
    exit 1
  fi

  # Verify AWS CLI installation
  if ! command -v aws &> /dev/null; then
    echo "AWS CLI installation failed. Please install it manually."
    exit 1
  else
    echo "AWS CLI has been installed successfully."
  fi
fi

# Set the environment variable
ENV="dev"

# Construct the S3 bucket name
BUCKET_NAME="${ENV}-event-sys-tfstate"

# Create the S3 bucket
aws s3 mb "s3://${BUCKET_NAME}"

echo "S3 bucket '${BUCKET_NAME}' created."

