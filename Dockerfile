# Use Node.js 18 LTS as base image
FROM node:18-bullseye

# Install Java 17 for Elasticsearch
RUN apt-get update && \
    apt-get install -y openjdk-17-jre curl wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

# Download and install Elasticsearch
RUN wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.11.1-linux-x86_64.tar.gz && \
    tar -xzf elasticsearch-8.11.1-linux-x86_64.tar.gz && \
    mv elasticsearch-8.11.1 /opt/elasticsearch && \
    rm elasticsearch-8.11.1-linux-x86_64.tar.gz

# Download and install Kibana
RUN wget https://artifacts.elastic.co/downloads/kibana/kibana-8.11.1-linux-x86_64.tar.gz && \
    tar -xzf kibana-8.11.1-linux-x86_64.tar.gz && \
    mv kibana-8.11.1 /opt/kibana && \
    rm kibana-8.11.1-linux-x86_64.tar.gz

# Create elasticsearch user
RUN useradd -m elasticsearch && \
    chown -R elasticsearch:elasticsearch /opt/elasticsearch && \
    chown -R elasticsearch:elasticsearch /opt/kibana

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Copy configurations
COPY elasticsearch.yml /opt/elasticsearch/config/elasticsearch.yml
COPY kibana.yml /opt/kibana/config/kibana.yml

# Create startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 5601 9200

# Start script
CMD ["/app/start.sh"] 