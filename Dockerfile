# Stage 1: Build the application
FROM node:20.8.0

# Set specific versions for tools
ENV TERRAFORM_VERSION=1.6.3
ENV AWS_CLI_VERSION=2.9.19
ENV KUBECTL_VERSION=v1.28.3
ENV HELM_VERSION=v3.13.1
ENV CDKTF_VERSION=0.19.0

WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install cdktf-cli globally
RUN npm install -g cdktf-cli@${CDKTF_VERSION} && yarn install

# Install project dependencies
RUN npm install

# Copy the entire project directory to the container
COPY . .

# Set the Terraform version as an environment variable
ENV TERRAFORM_VERSION=${TERRAFORM_VERSION}

# Stage 2: Install Terraform from HashiCorp APT repository
RUN apt-get update -y && apt-get install -y lsb-release gnupg && apt-get clean all && \
    wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list && \
    apt-get update -y && apt-get install -y "terraform=${TERRAFORM_VERSION}-*"

# Stage 3: Install AWS CLI, kubectl, Helm, and Taskset
RUN apt-get update -y && apt-get install -y \
    curl \
    unzip

# Install specific version of AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install -i /usr/local/aws-cli -b /usr/local/bin && \
    rm -rf awscliv2.zip ./aws

# Install specific version of kubectl
RUN curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin

# Install specific version of Helm
RUN curl https://get.helm.sh/helm-${HELM_VERSION}-linux-amd64.tar.gz -o helm.tar.gz && \
    tar -xzf helm.tar.gz && \
    mv linux-amd64/helm /usr/local/bin && \
    rm -rf helm.tar.gz linux-amd64

# Install specific version of Taskset
RUN curl -fsSL https://taskfile.dev/install.sh | sh

# Specify the full path to the cdktf binary
CMD [ "/usr/local/bin/cdktf" ]