#!/bin/bash

# Create directories for Elasticsearch and Kibana
mkdir -p /opt/elasticsearch/data
mkdir -p /opt/elasticsearch/logs
mkdir -p /opt/kibana/data
chown -R elasticsearch:elasticsearch /opt/elasticsearch
chown -R elasticsearch:elasticsearch /opt/kibana

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

# Set up built-in users and passwords
echo "Setting up Elasticsearch security..."

# Generate a password for elastic user
ELASTIC_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "Generated password for elastic user: $ELASTIC_PASSWORD"

# Set passwords for built-in users
su elasticsearch -c "/opt/elasticsearch/bin/elasticsearch-reset-password -u elastic -p $ELASTIC_PASSWORD --batch"

# Export password for Kibana
export ELASTIC_PASSWORD=$ELASTIC_PASSWORD

# Update Kibana config with the password
sed -i "s/\${ELASTIC_PASSWORD}/$ELASTIC_PASSWORD/g" /opt/kibana/config/kibana.yml

echo "Elasticsearch security configured!"
echo "====================================="
echo "ELASTIC PASSWORD: $ELASTIC_PASSWORD"
echo "====================================="

# Start Kibana in background as elasticsearch user
echo "Starting Kibana..."
su elasticsearch -c "ELASTIC_PASSWORD=$ELASTIC_PASSWORD /opt/kibana/bin/kibana &"

# Wait for Kibana to start
echo "Waiting for Kibana to start..."
sleep 60

# Test Kibana connection
until curl -s http://localhost:5601 > /dev/null; do
    echo "Waiting for Kibana..."
    sleep 10
done

echo "Kibana is ready!"

# Keep the container running by running a simple web server for health checks
echo "System ready! Elasticsearch: http://localhost:9200, Kibana: http://localhost:5601"
echo "Login credentials: elastic / $ELASTIC_PASSWORD"

# Simple health check server that also shows credentials
node -e "
const http = require('http');
const elasticPassword = process.env.ELASTIC_PASSWORD || '$ELASTIC_PASSWORD';
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({
      status: 'ok', 
      elasticsearch: 'http://localhost:9200', 
      kibana: 'http://localhost:5601',
      credentials: 'elastic / ' + elasticPassword
    }));
  } else if (req.url === '/credentials') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Username: elastic\\nPassword: ' + elasticPassword);
  } else {
    res.writeHead(302, {'Location': 'http://localhost:5601'});
    res.end('Redirect to Kibana. Credentials: elastic / ' + elasticPassword);
  }
});
server.listen(8080, () => console.log('Health check server on port 8080, credentials: elastic / ' + elasticPassword));
" 