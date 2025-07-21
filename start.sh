#!/bin/bash

# Create directories for Elasticsearch
mkdir -p /opt/elasticsearch/data
mkdir -p /opt/elasticsearch/logs
chown -R elasticsearch:elasticsearch /opt/elasticsearch

# Start Elasticsearch in background as elasticsearch user
echo "Starting Elasticsearch..."
su elasticsearch -c "/opt/elasticsearch/bin/elasticsearch -d"

# Wait for Elasticsearch to start
echo "Waiting for Elasticsearch to start..."
sleep 30

# Test Elasticsearch connection
until curl -s http://localhost:9200 > /dev/null; do
    echo "Waiting for Elasticsearch..."
    sleep 5
done

echo "Elasticsearch is ready!"

# Start web interface
echo "Starting sicap-parser web interface..."
node server.js 