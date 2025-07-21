const express = require('express');
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Basic HTML interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>SICAP Parser - Vehicule Electrice</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h1 { color: #2c3e50; }
            .form-group { margin: 15px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, button { padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #3498db; color: white; cursor: pointer; }
            button:hover { background: #2980b9; }
            .results { margin-top: 20px; }
            .loading { color: #f39c12; }
            .success { color: #27ae60; }
            .error { color: #e74c3c; }
            .result-item { border: 1px solid #eee; padding: 15px; margin: 10px 0; border-radius: 4px; }
            .value { font-weight: bold; color: #27ae60; }
            .authority { color: #34495e; font-style: italic; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚌 SICAP Parser - Vehicule Electrice & Stații de Încărcare</h1>
            
            <div class="card">
                <h2>Rulează Parser</h2>
                <div class="form-group">
                    <label>Data (DD-MM-YYYY):</label>
                    <input type="text" id="date" placeholder="21-07-2025" value="${new Date().toLocaleDateString('ro-RO', {day: '2-digit', month: '2-digit', year: 'numeric'}).replace(/\\./g, '-')}">
                </div>
                <div class="form-group">
                    <label>Concurrency:</label>
                    <input type="number" id="concurrency" value="2" min="1" max="5">
                </div>
                <button onclick="runParser()">🔍 Caută Licitații</button>
                <button onclick="viewResults()">📊 Vezi Rezultate</button>
                <button onclick="clearResults()">🗑️ Șterge Date</button>
            </div>

            <div class="card">
                <h2>Status Elasticsearch</h2>
                <button onclick="checkElasticsearch()">🔄 Verifică Status</button>
                <div id="es-status"></div>
            </div>

            <div class="card">
                <h2>Rezultate</h2>
                <div id="results"></div>
            </div>
        </div>

        <script>
            async function runParser() {
                const date = document.getElementById('date').value;
                const concurrency = document.getElementById('concurrency').value;
                const resultsDiv = document.getElementById('results');
                
                resultsDiv.innerHTML = '<div class="loading">🔄 Parsez licitațiile...</div>';
                
                try {
                    const response = await fetch('/api/parse', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ date, concurrency: parseInt(concurrency) })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        resultsDiv.innerHTML = \`<div class="success">✅ Găsite \${result.count} licitații relevante!</div>\`;
                        setTimeout(viewResults, 1000);
                    } else {
                        resultsDiv.innerHTML = \`<div class="error">❌ Eroare: \${result.error}</div>\`;
                    }
                } catch (error) {
                    resultsDiv.innerHTML = \`<div class="error">❌ Eroare: \${error.message}</div>\`;
                }
            }

            async function viewResults() {
                const resultsDiv = document.getElementById('results');
                resultsDiv.innerHTML = '<div class="loading">📊 Încărcare rezultate...</div>';
                
                try {
                    const response = await fetch('/api/results');
                    const data = await response.json();
                    
                    if (data.results && data.results.length > 0) {
                        let html = \`<h3>📋 \${data.total} Licitații găsite</h3>\`;
                        
                        data.results.forEach(item => {
                            html += \`
                                <div class="result-item">
                                    <h4>\${item.contractTitle}</h4>
                                    <div class="value">💰 \${item.ronContractValue.toLocaleString('ro-RO')} RON</div>
                                    <div class="authority">🏛️ \${item.contractingAuthorityNameAndFN}</div>
                                    <div>📋 CPV: \${item.cpvCodeAndName}</div>
                                    <div>🆔 ID: \${item.caNoticeId}</div>
                                </div>
                            \`;
                        });
                        
                        resultsDiv.innerHTML = html;
                    } else {
                        resultsDiv.innerHTML = '<div>📭 Nu sunt rezultate disponibile.</div>';
                    }
                } catch (error) {
                    resultsDiv.innerHTML = \`<div class="error">❌ Eroare: \${error.message}</div>\`;
                }
            }

            async function clearResults() {
                if (confirm('Sigur vrei să ștergi toate datele?')) {
                    try {
                        const response = await fetch('/api/clear', { method: 'DELETE' });
                        const result = await response.json();
                        document.getElementById('results').innerHTML = '<div class="success">✅ Date șterse!</div>';
                    } catch (error) {
                        document.getElementById('results').innerHTML = \`<div class="error">❌ Eroare: \${error.message}</div>\`;
                    }
                }
            }

            async function checkElasticsearch() {
                const statusDiv = document.getElementById('es-status');
                statusDiv.innerHTML = '<div class="loading">🔄 Verificare...</div>';
                
                try {
                    const response = await fetch('/api/elasticsearch-status');
                    const data = await response.json();
                    
                    if (data.status === 'ok') {
                        statusDiv.innerHTML = \`
                            <div class="success">✅ Elasticsearch funcționează</div>
                            <div>📊 Cluster: \${data.cluster_name}</div>
                            <div>📦 Versiune: \${data.version}</div>
                        \`;
                    } else {
                        statusDiv.innerHTML = '<div class="error">❌ Elasticsearch nu răspunde</div>';
                    }
                } catch (error) {
                    statusDiv.innerHTML = \`<div class="error">❌ Eroare: \${error.message}</div>\`;
                }
            }

            // Check status on load
            setTimeout(checkElasticsearch, 1000);
        </script>
    </body>
    </html>
  `);
});

// API Endpoints
app.post('/api/parse', async (req, res) => {
  const { date, concurrency = 2 } = req.body;
  
  try {
    const child = spawn('sicap-parser', ['licitatii', '--date', date, '--concurrency', concurrency.toString()], {
      cwd: '/app'
    });

    let output = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString();
    });

    child.on('close', async (code) => {
      if (code === 0) {
        // Get count from Elasticsearch
        try {
          const esResponse = await axios.get('http://localhost:9200/_cat/indices?v');
          const lines = esResponse.data.split('\n');
          const licitatiiLine = lines.find(line => line.includes('licitatii-publice'));
          const count = licitatiiLine ? parseInt(licitatiiLine.split(/\s+/)[6]) || 0 : 0;
          
          res.json({ success: true, count, output });
        } catch (esError) {
          res.json({ success: true, count: 0, output });
        }
      } else {
        res.json({ success: false, error: output });
      }
    });

  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/results', async (req, res) => {
  try {
    const esResponse = await axios.get('http://localhost:9200/licitatii-publice/_search', {
      params: {
        size: 100,
        sort: 'item.ronContractValue:desc'
      }
    });

    const hits = esResponse.data.hits.hits;
    const results = hits.map(hit => hit._source.item);

    res.json({
      total: esResponse.data.hits.total.value,
      results
    });
  } catch (error) {
    res.json({ results: [], error: error.message });
  }
});

app.delete('/api/clear', async (req, res) => {
  try {
    await axios.delete('http://localhost:9200/licitatii-publice');
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get('/api/elasticsearch-status', async (req, res) => {
  try {
    const esResponse = await axios.get('http://localhost:9200');
    res.json({
      status: 'ok',
      cluster_name: esResponse.data.cluster_name,
      version: esResponse.data.version.number
    });
  } catch (error) {
    res.json({ status: 'error', error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SICAP Parser server running on port ${PORT}`);
  console.log(`📊 Web interface: http://localhost:${PORT}`);
}); 