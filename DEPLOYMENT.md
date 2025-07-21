# 🚀 Deployment pe Railway - SICAP Parser

## 📋 Pregătirea pentru deployment

### 1. Instalează Railway CLI
```bash
npm install -g @railway/cli
```

### 2. Login în Railway
```bash
railway login
```

### 3. Inițializează proiectul
```bash
cd sicap-parser
railway init
```

## 🔧 Configurare Railway

### 1. Setează variabilele de mediu
```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

### 2. Deploy aplicația
```bash
railway up
```

## 📊 Monitoring și Management

### URL-uri importante:
- **Web Interface**: `https://your-app.railway.app`
- **Elasticsearch Status**: `https://your-app.railway.app/api/elasticsearch-status`
- **API Results**: `https://your-app.railway.app/api/results`

### Comenzi utile:
```bash
# Vezi log-urile aplicației
railway logs

# Redeploy aplicația
railway up --detach

# Verifică statusul
railway status

# Conectează-te la aplicație
railway connect
```

## ⚙️ Configurația sistemului

### Resurse Railway:
- **CPU**: 1 vCPU
- **Memory**: 2 GB RAM
- **Storage**: 1 GB (pentru Elasticsearch)

### Porturile expuse:
- **3000**: Web interface
- **9200**: Elasticsearch (internal)

## 🔍 Testarea aplicației

### 1. Verifică că Elasticsearch funcționează:
```bash
curl https://your-app.railway.app/api/elasticsearch-status
```

### 2. Testează parsarea:
```json
POST https://your-app.railway.app/api/parse
Content-Type: application/json

{
  "date": "21-07-2025",
  "concurrency": 2
}
```

### 3. Vezi rezultatele:
```bash
curl https://your-app.railway.app/api/results
```

## 🛠️ Troubleshooting

### Probleme comune:

1. **Elasticsearch nu pornește**:
   - Verifică log-urile: `railway logs`
   - Asigură-te că ai suficientă memorie alocată

2. **Build eșuează**:
   - Verifică că toate fișierele sunt commit-ate în Git
   - Verifică Dockerfile syntax

3. **Aplicația nu răspunde**:
   - Verifică că portul 3000 este expus corect
   - Verifică health check-ul

### Log monitoring:
```bash
# Vezi log-urile în timp real
railway logs --follow

# Vezi log-urile pentru o anumită perioadă
railway logs --since 1h
```

## 🔄 Actualizări

Pentru a actualiza aplicația:

1. Fă modificările în cod
2. Commit și push în Git
3. Rulează: `railway up`

## 💡 Optimizări pentru producție

### 1. Configurare Elasticsearch optimizată:
- Index management pentru date mai vechi
- Backup automat
- Monitoring performanță

### 2. Scalabilitate:
- Horizontal scaling pentru traffic mare
- Database extern pentru persistență
- CDN pentru assets statice

### 3. Securitate:
- HTTPS enforced
- Rate limiting pentru API
- Authentication pentru admin interface

## 📱 Accesarea aplicației

După deployment, poți accesa:

1. **Dashboard web**: `https://your-app.railway.app`
2. **API direct**: `https://your-app.railway.app/api/*`
3. **Status monitoring**: `https://your-app.railway.app/api/elasticsearch-status`

Aplicația va avea o interfață web completă pentru:
- ✅ Rularea parser-ului pentru orice dată
- ✅ Vizualizarea rezultatelor în timp real
- ✅ Management Elasticsearch
- ✅ Monitoring sistem 