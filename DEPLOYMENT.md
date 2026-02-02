# Guide de Déploiement - RentMaestro

Ce guide vous explique comment déployer RentMaestro sur votre propre serveur.

## Table des matières
1. [Prérequis](#prérequis)
2. [Déploiement avec Docker (Recommandé)](#déploiement-avec-docker)
3. [Déploiement Manuel](#déploiement-manuel)
4. [Configuration Nginx](#configuration-nginx)
5. [SSL avec Let's Encrypt](#ssl-avec-lets-encrypt)
6. [Variables d'Environnement](#variables-denvironnement)
7. [Maintenance](#maintenance)

---

## Prérequis

### Serveur minimum recommandé
- **CPU** : 2 vCPU
- **RAM** : 2 GB
- **Stockage** : 20 GB SSD
- **OS** : Ubuntu 22.04 LTS (recommandé)

### Logiciels requis
```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des outils de base
sudo apt install -y curl git wget unzip
```

---

## Déploiement avec Docker

### 1. Installer Docker et Docker Compose

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Installer Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Vérifier l'installation
docker --version
docker-compose --version
```

### 2. Cloner le repository

```bash
cd /opt
sudo git clone https://github.com/VOTRE_USERNAME/rentmaestro.git
cd rentmaestro
sudo chown -R $USER:$USER .
```

### 3. Créer les fichiers Docker

#### Dockerfile Backend (`backend/Dockerfile`)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY . .

# Créer le dossier uploads
RUN mkdir -p /app/uploads

# Exposer le port
EXPOSE 8001

# Démarrer l'application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

#### Dockerfile Frontend (`frontend/Dockerfile`)
```dockerfile
# Étape 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN yarn build

# Étape 2: Serveur Nginx
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Configuration Nginx pour le frontend (`frontend/nginx.conf`)
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker
    location /service-worker.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # React Router - toutes les routes vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  # Base de données MongoDB
  mongodb:
    image: mongo:6.0
    container_name: rentmaestro-db
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=rentmaestro
    networks:
      - rentmaestro-network

  # Backend FastAPI
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: rentmaestro-backend
    restart: unless-stopped
    depends_on:
      - mongodb
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=rentmaestro
      - JWT_SECRET=${JWT_SECRET}
      - VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}
      - VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}
      - VAPID_CLAIMS_EMAIL=${VAPID_CLAIMS_EMAIL}
      - CORS_ORIGINS=${CORS_ORIGINS}
    volumes:
      - uploads_data:/app/uploads
    networks:
      - rentmaestro-network

  # Frontend React
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL}
    container_name: rentmaestro-frontend
    restart: unless-stopped
    depends_on:
      - backend
    networks:
      - rentmaestro-network

  # Reverse Proxy Nginx
  nginx:
    image: nginx:alpine
    container_name: rentmaestro-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - certbot_data:/var/www/certbot:ro
    depends_on:
      - frontend
      - backend
    networks:
      - rentmaestro-network

  # Certbot pour SSL (optionnel)
  certbot:
    image: certbot/certbot
    container_name: rentmaestro-certbot
    volumes:
      - certbot_data:/var/www/certbot
      - ./nginx/ssl:/etc/letsencrypt
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    networks:
      - rentmaestro-network

volumes:
  mongodb_data:
  uploads_data:
  certbot_data:

networks:
  rentmaestro-network:
    driver: bridge
```

### 4. Créer le fichier d'environnement

```bash
# Créer le fichier .env à la racine
cat > .env << 'EOF'
# Application
REACT_APP_BACKEND_URL=https://votre-domaine.com
CORS_ORIGINS=https://votre-domaine.com

# Sécurité - CHANGEZ CES VALEURS !
JWT_SECRET=votre-cle-secrete-tres-longue-et-complexe-minimum-32-caracteres

# Push Notifications (générez vos propres clés)
VAPID_PRIVATE_KEY=-MnLmuOAiSM3vHxJ7XMAvoKQxbM4WIxVhBQOr7P8KAA
VAPID_PUBLIC_KEY=BM4EvkGHK6qgk-NC6j5XJtyFv5s-YixzxYWzbhrDwbjqBJ8XcnebRURaFoSgoeR_MQP5K91ELlCTpRdZ00XxS5A
VAPID_CLAIMS_EMAIL=mailto:contact@votre-domaine.com
EOF
```

### 5. Configuration Nginx principale

```bash
mkdir -p nginx/ssl

cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Optimisations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml application/rss+xml application/atom+xml image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Upstream servers
    upstream backend {
        server backend:8001;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP - Redirection vers HTTPS
    server {
        listen 80;
        server_name votre-domaine.com www.votre-domaine.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS
    server {
        listen 443 ssl http2;
        server_name votre-domaine.com www.votre-domaine.com;

        # Certificats SSL
        ssl_certificate /etc/nginx/ssl/live/votre-domaine.com/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/votre-domaine.com/privkey.pem;

        # Configuration SSL sécurisée
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Headers de sécurité
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API Backend
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF
```

### 6. Démarrer l'application

```bash
# Construire et démarrer tous les services
docker-compose up -d --build

# Voir les logs
docker-compose logs -f

# Vérifier le statut
docker-compose ps
```

---

## Déploiement Manuel (sans Docker)

### 1. Installer MongoDB

```bash
# Importer la clé GPG MongoDB
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor

# Ajouter le repository
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Installer MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 2. Installer Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g yarn
```

### 3. Installer Python

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip
```

### 4. Configurer le Backend

```bash
cd /opt/rentmaestro/backend

# Créer un environnement virtuel
python3.11 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=rentmaestro
JWT_SECRET=votre-cle-secrete-tres-longue
VAPID_PRIVATE_KEY=-MnLmuOAiSM3vHxJ7XMAvoKQxbM4WIxVhBQOr7P8KAA
VAPID_PUBLIC_KEY=BM4EvkGHK6qgk-NC6j5XJtyFv5s-YixzxYWzbhrDwbjqBJ8XcnebRURaFoSgoeR_MQP5K91ELlCTpRdZ00XxS5A
VAPID_CLAIMS_EMAIL=mailto:contact@votre-domaine.com
CORS_ORIGINS=https://votre-domaine.com
EOF

# Créer le dossier uploads
mkdir -p uploads
```

### 5. Configurer le Frontend

```bash
cd /opt/rentmaestro/frontend

# Créer le fichier .env
cat > .env << 'EOF'
REACT_APP_BACKEND_URL=https://votre-domaine.com
EOF

# Installer les dépendances
yarn install

# Build pour la production
yarn build
```

### 6. Créer les services Systemd

#### Service Backend (`/etc/systemd/system/rentmaestro-backend.service`)
```ini
[Unit]
Description=RentMaestro Backend API
After=network.target mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/rentmaestro/backend
Environment=PATH=/opt/rentmaestro/backend/venv/bin
ExecStart=/opt/rentmaestro/backend/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Créer le service
sudo nano /etc/systemd/system/rentmaestro-backend.service
# Coller le contenu ci-dessus

# Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable rentmaestro-backend
sudo systemctl start rentmaestro-backend
```

---

## Configuration Nginx (Manuel)

### Installation
```bash
sudo apt install -y nginx
```

### Configuration (`/etc/nginx/sites-available/rentmaestro`)
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    # SSL (sera configuré par Certbot)
    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Frontend (fichiers statiques)
    root /opt/rentmaestro/frontend/build;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;
    }

    # Frontend React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache statique
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/rentmaestro /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Tester et redémarrer
sudo nginx -t
sudo systemctl restart nginx
```

---

## SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Vérifier le renouvellement automatique
sudo certbot renew --dry-run
```

---

## Variables d'Environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGO_URL` | URL de connexion MongoDB | `mongodb://localhost:27017` |
| `DB_NAME` | Nom de la base de données | `rentmaestro` |
| `JWT_SECRET` | Clé secrète pour les tokens JWT | `une-cle-de-32-caracteres-min` |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID (push) | Générée automatiquement |
| `VAPID_PUBLIC_KEY` | Clé publique VAPID (push) | Générée automatiquement |
| `VAPID_CLAIMS_EMAIL` | Email pour VAPID | `mailto:contact@domaine.com` |
| `CORS_ORIGINS` | Origines autorisées | `https://votre-domaine.com` |
| `REACT_APP_BACKEND_URL` | URL du backend | `https://votre-domaine.com` |

### Générer de nouvelles clés VAPID

```python
# Script Python pour générer des clés VAPID
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import base64

private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
public_key = private_key.public_key()

public_numbers = public_key.public_numbers()
x = public_numbers.x.to_bytes(32, 'big')
y = public_numbers.y.to_bytes(32, 'big')
public_bytes = b'\x04' + x + y
public_b64 = base64.urlsafe_b64encode(public_bytes).rstrip(b'=').decode()

private_numbers = private_key.private_numbers()
private_bytes = private_numbers.private_value.to_bytes(32, 'big')
private_b64 = base64.urlsafe_b64encode(private_bytes).rstrip(b'=').decode()

print(f"VAPID_PRIVATE_KEY={private_b64}")
print(f"VAPID_PUBLIC_KEY={public_b64}")
```

---

## Maintenance

### Sauvegardes MongoDB

```bash
# Sauvegarde manuelle
mongodump --db rentmaestro --out /backup/mongodb/$(date +%Y%m%d)

# Script de sauvegarde automatique (cron)
cat > /opt/scripts/backup-mongodb.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --db rentmaestro --out "$BACKUP_DIR/$DATE"
# Supprimer les sauvegardes de plus de 7 jours
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
EOF

chmod +x /opt/scripts/backup-mongodb.sh

# Ajouter au cron (tous les jours à 2h)
echo "0 2 * * * /opt/scripts/backup-mongodb.sh" | sudo crontab -
```

### Mise à jour de l'application

```bash
# Avec Docker
cd /opt/rentmaestro
git pull
docker-compose down
docker-compose up -d --build

# Sans Docker
cd /opt/rentmaestro
git pull

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart rentmaestro-backend

# Frontend
cd ../frontend
yarn install
yarn build
sudo systemctl restart nginx
```

### Logs

```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Systemd
sudo journalctl -u rentmaestro-backend -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoring (optionnel)

```bash
# Installer htop pour monitoring système
sudo apt install -y htop

# Vérifier l'espace disque
df -h

# Vérifier la mémoire
free -h

# Vérifier les processus
htop
```

---

## Support

Pour toute question ou problème :
- Consultez les logs de l'application
- Vérifiez les variables d'environnement
- Assurez-vous que tous les services sont démarrés

**Bonne utilisation de RentMaestro !** 🏠
