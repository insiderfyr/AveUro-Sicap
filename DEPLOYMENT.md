# 🚀 Deployment pe Railway - SICAP Parser cu Kibana (Securizat)

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

## 🔐 Autentificare și Securitate

### Sistemul este securizat cu autentificare Elasticsearch built-in!

#### Obținerea credențialelor:

1. **După deployment, vezi log-urile**:
   ```bash
   railway logs
   ```
   Caută linia: `ELASTIC PASSWORD: [generated-password]`

2. **Sau accesează endpoint-ul de credențiale**:
   ```bash
   curl https://your-app.railway.app/credentials
   ```

3. **Sau verifică health check**:
   ```bash
   curl https://your-app.railway.app/health
   ```

#### Credențialele generate automat:
- **Username**: `elastic`
- **Password**: `[25-character random password]`

## 📊 Accesarea Kibana

### URL principal:
- **Kibana Interface**: `https://your-app.railway.app`
- **Login screen**: Va apărea automat
- **Credentials endpoint**: `https://your-app.railway.app/credentials`

### Primul login:
1. Accesează `https://your-app.railway.app`
2. **Username**: `elastic`
3. **Password**: Obține din log-uri sau `/credentials`
4. Click **Log in**

## 📈 Configurarea Kibana pentru SICAP

### 1. Primul setup în Kibana (după login):

1. **Stack Management** → **Index Patterns**
2. **Create index pattern** cu numele: `licitatii-publice*`
3. **Time field**: Selectează `@timestamp` sau `item.noticeStateDate`
4. **Save index pattern**

### 2. Explorarea datelor:

1. **Analytics** → **Discover**
2. Selectează index pattern-ul `licitatii-publice*`
3. Vei vedea toate licitațiile indexate cu filtrul sofisticat

## 🔍 Rularea sicap-parser din SSH

Pentru a popula datele în Elasticsearch, te conectezi la container via Railway:

```bash
# Conectează-te la containerul Railway
railway connect

# Rulează parser-ul pentru o dată specifică (va folosi credențialele automat)
sicap-parser licitatii --date 21-07-2025 --concurrency 2

# Vezi rezultatele în Kibana
# Mergi la https://your-app.railway.app și refresh Discover
```

## 🛡️ Securitate

### Caracteristici de securitate activate:

1. **✅ Autentificare obligatorie** - nimeni nu poate accesa fără username/password
2. **✅ Password generat automat** - 25 caractere aleatorii la fiecare deploy
3. **✅ Built-in users** - sistem de utilizatori Elasticsearch standard
4. **✅ HTTPS prin Railway** - comunicație criptată
5. **✅ No external exposure** - Elasticsearch accesibil doar intern

### Managementul credențialelor:

- **Password se regenerează** la fiecare redeploy
- **Salvează credențialele** după primul deployment
- **Acces prin Railway logs** dacă uiți parola
- **Endpoint /credentials** pentru recuperare

## 📊 Crearea de Dashboard-uri

### Dashboard pentru vehicule electrice:

1. **Analytics** → **Dashboard** (după autentificare)
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
- **Memory**: 3 GB RAM (pentru Elasticsearch + Kibana)
- **Storage**: 1 GB (pentru Elasticsearch + Kibana)

### Porturile expuse:
- **5601**: Kibana (principal, cu autentificare)
- **9200**: Elasticsearch (internal, securizat)
- **8080**: Health check + credentials (internal)

## 🔄 Workflow de utilizare

### 1. Obținere credențiale (prima dată):
```bash
railway logs | grep "ELASTIC PASSWORD"
# sau
curl https://your-app.railway.app/credentials
```

### 2. Login în Kibana:
- Accesează `https://your-app.railway.app`
- Username: `elastic`
- Password: din pasul 1

### 3. Populare date (via SSH):
```bash
railway connect
sicap-parser licitatii --date 21-07-2025 --concurrency 2
```

### 4. Analiză în Kibana:
- Discover → vezi datele noi
- Dashboard → analize vizuale
- Export → CSV/Excel cu date filtrate

## 🛠️ Troubleshooting

### Probleme comune:

1. **Nu pot accesa Kibana**:
   - Verifică că aplicația rulează: `railway status`
   - Verifică log-urile: `railway logs`

2. **Am uitat parola**:
   - Obține din log-uri: `railway logs | grep "ELASTIC PASSWORD"`
   - Sau accesează: `https://your-app.railway.app/credentials`

3. **Login nu funcționează**:
   - Asigură-te că folosești username `elastic`
   - Copiază parola exact (fără spații)
   - Verifică că Elasticsearch e pornit în log-uri

4. **Index pattern nu se creează**:
   - Asigură-te că există date în `licitatii-publice`
   - Rulează sicap-parser pentru o dată recentă

## 📱 Accesarea de pe mobil

Kibana este responsive și funcționează pe:
- **Telefoane** - login și funcționalitate de bază
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

## 🔐 Securitate avansată (opțional)

Pentru securitate suplimentară, poți:

1. **Schimba parola** după primul login
2. **Creează utilizatori** pentru echipa ta
3. **Setează roluri** pentru accesuri diferite
4. **Configurează IP restrictions** în Railway

**Sistemul oferă securitate completă cu toată puterea Kibana pentru analiza profesională!** 🔒📊⚡ 