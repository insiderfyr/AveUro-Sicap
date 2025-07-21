# 🚀 Deployment pe Railway - SICAP Parser cu Kibana

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
railway variables set PORT=5601
```

### 2. Deploy aplicația
```bash
railway up
```

## 📊 Accesarea Kibana

### URL principal:
- **Kibana Interface**: `https://your-app.railway.app` (redirect automat la Kibana)
- **Direct Kibana**: `https://your-app.railway.app:5601`
- **Health Check**: `https://your-app.railway.app/health`

### Comenzi utile:
```bash
# Vezi log-urile aplicației
railway logs

# Redeploy aplicația
railway up --detach

# Verifică statusul
railway status
```

## 📈 Configurarea Kibana pentru SICAP

### 1. Primul setup în Kibana:

1. **Accesează Kibana** la URL-ul obținut
2. **Stack Management** → **Index Patterns**
3. **Create index pattern** cu numele: `licitatii-publice*`
4. **Time field**: Selectează `@timestamp` sau `item.noticeStateDate`
5. **Save index pattern**

### 2. Explorarea datelor:

1. **Analytics** → **Discover**
2. Selectează index pattern-ul `licitatii-publice*`
3. Vei vedea toate licitațiile indexate cu filtrul sofisticat

### 3. Câmpurile importante pentru analiză:

- `item.contractTitle` - Titlul contractului
- `item.ronContractValue` - Valoarea în RON
- `item.cpvCodeAndName` - Codul și descrierea CPV
- `item.contractingAuthorityNameAndFN` - Autoritatea contractantă
- `item.noticeStateDate` - Data publicării

## 🔍 Rularea sicap-parser din SSH

Pentru a popula datele în Elasticsearch, te conectezi la container via Railway:

```bash
# Conectează-te la containerul Railway
railway connect

# Rulează parser-ul pentru o dată specifică
sicap-parser licitatii --date 21-07-2025 --concurrency 2

# Vezi rezultatele în Kibana
# Mergi la https://your-app.railway.app și refresh Discover
```

## 📊 Crearea de Dashboard-uri

### Dashboard pentru vehicule electrice:

1. **Analytics** → **Dashboard**
2. **Create new dashboard**
3. **Add panel** → **Aggregation based**

#### Vizualizări recomandate:

1. **Pie Chart - Distribuția pe tip de vehicul**:
   - Buckets: Terms pe `item.cpvCodeAndName.keyword`
   
2. **Bar Chart - Top autorități contractante**:
   - Buckets: Terms pe `item.contractingAuthorityNameAndFN.keyword`
   - Metrics: Sum pe `item.ronContractValue`

3. **Line Chart - Evoluția în timp**:
   - X-axis: Date Histogram pe `item.noticeStateDate`
   - Y-axis: Count

4. **Data Table - Top contracte pe valoare**:
   - Buckets: Terms pe `item.contractTitle.keyword`
   - Metrics: Max pe `item.ronContractValue`

## ⚙️ Configurația sistemului

### Resurse Railway:
- **CPU**: 1 vCPU
- **Memory**: 3 GB RAM (crescut pentru Kibana)
- **Storage**: 1 GB (pentru Elasticsearch + Kibana)

### Porturile expuse:
- **5601**: Kibana (principal)
- **9200**: Elasticsearch (internal)
- **8080**: Health check (internal)

## 🔄 Workflow de utilizare

### 1. Populare date (via SSH):
```bash
railway connect
sicap-parser licitatii --date 21-07-2025 --concurrency 2
```

### 2. Analiză în Kibana:
- Accesează `https://your-app.railway.app`
- Discover → vezi datele noi
- Dashboard → analize vizuale

### 3. Export rezultate:
- CSV export din Discover
- Saved searches pentru filtre frecvente
- Rapoarte programate (Kibana Pro)

## 🛠️ Troubleshooting

### Probleme comune:

1. **Kibana nu se încarcă**:
   - Verifică că Elasticsearch e pornit: `curl https://your-app.railway.app/health`
   - Verifică log-urile: `railway logs`

2. **Index pattern nu se creează**:
   - Asigură-te că există date în `licitatii-publice`
   - Rulează sicap-parser pentru o dată recentă

3. **Performance probleme**:
   - Crește memoria în `railway.toml`
   - Limitează time range în Kibana

## 📱 Accesarea de pe mobil

Kibana este responsive și funcționează pe:
- **Telefoane** - funcționalitate limitată dar vizualizări ok
- **Tablete** - experiență completă
- **Desktop** - experiență optimă

## 💡 Tips pentru analiză eficientă

### Filtre utile în Discover:
```
item.cpvCodeAndName: "*electric*"
item.contractTitle: "*autobuz*" OR "*microbuz*" OR "*stație*"
item.ronContractValue: >1000000
```

### Saved searches recomandate:
- "Autobuze electrice > 5 mil RON"
- "Stații de încărcare 2025"
- "Top autorități vehicule electrice"

Sistemul oferă **toată puterea Kibana** pentru analiza profesională a licitațiilor cu vehicule electrice! 📊⚡ 