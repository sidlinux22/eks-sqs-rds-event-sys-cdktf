# Stage 1: Build the application
FROM node:20.8.0
ENV TERRAFORM_VERSION=1.6.3

WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install cdktf-cli globally
RUN npm install -g cdktf-cli@0.18.0

# Install project dependencies
RUN npm install

# Copy the entire project directory to the container
COPY . .

# Set the Terraform version as an environment variable

# Stage 2: Install Terraform from HashiCorp APT repository
RUN apt-get update && apt-get install -y lsb-release && apt-get clean all && \
    wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/hashicorp.list && \
    apt-get update && apt-get install -y terraform=${TERRAFORM_VERSION}-*

# Specify the full path to the cdktf binary
CMD [ "/usr/local/bin/cdktf" ]
