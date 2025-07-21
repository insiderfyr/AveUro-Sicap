import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SICAP Parser',
    version: '1.0.0',
    port: PORT
  });
});

// API endpoint for SICAP data
app.get('/api/status', (req, res) => {
  res.json({
    message: 'SICAP Parser API is running',
    endpoints: {
      health: '/health',
      status: '/api/status'
    },
    port: PORT,
    note: 'This is a simplified version for production deployment. Elasticsearch and Kibana services need to be configured separately.'
  });
});

// Serve the main application
app.get('/', (req, res) => {
  res.json({
    message: 'SICAP Parser - Parser pentru licitații SICAP',
    description: 'Focus pe vehicule electrice și stații de încărcare',
    version: '1.0.0',
    port: PORT,
    endpoints: {
      health: '/health',
      api: '/api/status'
    }
  });
});

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log(`🚀 SICAP Parser server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API status: http://localhost:${PORT}/api/status`);
});

// Error handling
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
  }
}); 