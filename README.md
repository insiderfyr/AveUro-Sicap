# AveUro-Sicap

Parser pentru licitații SICAP cu focus pe vehicule electrice și stații de încărcare.

## 🚀 Deploy pe Hetzner (Producție)

### Varianta 1: Deploy clasic (npm + pm2) - RECOMANDAT

```bash
# 1. Conectează-te la serverul Hetzner
ssh root@your-server-ip

# 2. Instalează Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clonează proiectul
git clone https://github.com/insiderfyr/AveUro-Sicap.git
cd AveUro-Sicap

# 4. Instalează dependențele
npm install

# 5. Instalează pm2 pentru proces management
npm install -g pm2

# 6. Pornește aplicația cu pm2
pm2 start server.js --name "aveuro-sicap"

# 7. Salvează configurația pm2 pentru repornire automată
pm2 save
pm2 startup
```

### Varianta 2: Deploy cu Docker

```bash
# 1. Conectează-te la serverul Hetzner
ssh root@your-server-ip

# 2. Instalează Docker (dacă nu ai)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clonează proiectul
git clone https://github.com/insiderfyr/AveUro-Sicap.git
cd AveUro-Sicap

# 4. Build și run container
docker build -t aveuro-sicap .
docker run -d -p 3000:3000 --name aveuro-sicap-container aveuro-sicap

# 5. Pentru repornire automată la reboot
docker update --restart=always aveuro-sicap-container
```

### Varianta 3: Deploy cu systemd service

```bash
# 1. Creează fișierul service
sudo nano /etc/systemd/system/aveuro-sicap.service
```

Conținut pentru `/etc/systemd/system/aveuro-sicap.service`:
```ini
[Unit]
Description=AveUro SICAP Parser
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/AveUro-Sicap
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
# 2. Activează și pornește serviciul
sudo systemctl daemon-reload
sudo systemctl enable aveuro-sicap
sudo systemctl start aveuro-sicap

# 3. Verifică statusul
sudo systemctl status aveuro-sicap
```

## 🔧 Configurare Nginx (opțional)

Pentru a expune aplicația pe port 80/443:

```bash
# Instalează Nginx
sudo apt update
sudo apt install nginx

# Creează configurația
sudo nano /etc/nginx/sites-available/aveuro-sicap
```

Conținut pentru Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activează site-ul
sudo ln -s /etc/nginx/sites-available/aveuro-sicap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 📊 Monitorizare

### Cu pm2:
```bash
pm2 status
pm2 logs aveuro-sicap
pm2 monit
```

### Cu Docker:
```bash
docker ps
docker logs aveuro-sicap-container
```

### Cu systemd:
```bash
sudo systemctl status aveuro-sicap
sudo journalctl -u aveuro-sicap -f
```

## 🔍 Testare

După deploy, testează:
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/status
```

## 📝 Logs

- **pm2**: `pm2 logs aveuro-sicap`
- **Docker**: `docker logs aveuro-sicap-container`
- **systemd**: `sudo journalctl -u aveuro-sicap -f`

---

## 📋 Descriere Proiect

**Mod de utilizare:**

```bash
➜  sicap-parser git:(master) ✗ sicap-parser --help
sicap-parser [command]

Commands:
  sicap-parser achizitii  Indexeaza achizitiile directe
  sicap-parser licitatii  Indexeaza licitatiile publice

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]

➜  sicap-parser git:(master) ✗ sicap-parser licitatii --help
sicap-parser licitatii

Indexeaza licitatiile publice

Options:
  --help             Show help                                         [boolean]
  --version          Show version number                               [boolean]
  --date, -d         Data in format zz-ll-aaaa               [string] [required]
  --host, -h         Url Elasticsearch (default localhost:9200)
                                     [string] [default: "http://localhost:9200"]
  --index, -i        Indexul Elasticsearch folosit pentru licitatiile publice
                     (default licitatii-publice)
                                         [string] [default: "licitatii-publice"]
  --concurrency, -c  Numarul de accesari concurente spre siteul SEAP (default 5)
                                                           [number] [default: 5]
  --archive, -a      foloseste arhiva istorica (baza de date 2007-218)
                                                      [boolean] [default: false]
```

Instalare:

```bash
git clone git@github.com:ciocan/sicap-parser.git
npm install
npm run build
npm link
```

_Nota: Node.js versiunea 14 este necesara pentru a functiona_

Exemple in actiune:

![sicap-parser-licitatii](./media/sicap-parser-licitatii.gif)

**Consideratii tehnice:**

Informatiile sunt descarcate folosind 3 api-uri:

http://e-licitatie.ro/api-pub/NoticeCommon/GetCANoticeList/

GetCANoticeList este folosit pentru a obtine lista cu informatii pe scurt despre licitatii.

![e-licitatie-screenshot](./media/e-licitatie-screenshot.png)

http://e-licitatie.ro/api-pub/C_PUBLIC_CANotice/get/123456

**C_PUBLIC_CANotice** obtine informatii despre autoritatea contractanta si detaliile ofertei

123456 reprezinta id-ul de legatura codificat intern ca si **caNoticeId**

http://e-licitatie.ro/api-pub/C_PUBLIC_CANotice/GetCANoticeContracts

**GetCANoticeContracts** este folosit pentru a obtine informatii despre firmele castigatoare

**<u>Nota 1:</u>** pentru a accesa arhiva istorica cu baza de date din perioada 2007-2018 se folosesc link-urile:

http://istoric.e-licitatie.ro/api-pub/NoticeCommon/GetCANoticeList/

http://istoric.e-licitatie.ro/api-pub/C_PUBLIC_CANotice/get/123456

http://istoric.e-licitatie.ro/api-pub/C_PUBLIC_CANotice/GetCANoticeContracts

<u>**Nota 2:**</u> datele rezultate contin mult mai multe informatii care nu sunt relevante (tot felul de id-uri de sistem sau prametrii). Aceste informatii sunt omise si nu sunt salvate in Elastic search.

<u>**Nota 3:**</u> de asemenea rezultatele obtinute contin informatii personale (nume, telefon email, etc) a persoanele responsabile de contracte. Colectarea acestor informatii cu caracter personal incalca regulamentul european privind protectia datelor (**GDPR**), in consecinta ele nu sunt salvate in Elastic search.

Pentru a vedea exact cum sunt transformate raspunsurile primite vezi codul sursa din **[src/transformers.js](src/transformers.js)**

Daca vrei sa accesezi api-urile intr-un mod mai usor poti folosi [Postman](https://www.postman.com/) importand [colectia](./data/postman-collection.json) special special exportata.

Pentru a salva timp si latime de banda poti instala [sicap-explorer](https://github.com/ciocan/sicap-explorer) - contine tutorial cum sa importi in Elasticsearch arhiva salvata ce contine 470k licitatii publice si 22m achizitii directe din periada 2007- iulie 2020.

```bash
elasticdump \
  --input=./licitatii-publice.json \
  --output=http://localhost:9200 \
```

**Nota 4:** Informatiile despre licitatiile publice (mai putin cele cu caracter personal) sunt informatii de natura publica si orice persoana are dreptul sa le prelucreze asa cum doreste. Datele sunt preluate din portalul de licitatii publice SEAP/SICAP în baza **Licenței pentru Guvernare Deschisa v1.0**

Acest proiect adopta principiile [Public Money / Public Code](https://publiccode.eu/) si doreste ca institutiile publice sa ofere access catre informatiile cu caracter public intr-un mod cat mai usor.

[![Public Money / Public Code](./media/pmpc.jpg)](https://publiccode.eu/)
