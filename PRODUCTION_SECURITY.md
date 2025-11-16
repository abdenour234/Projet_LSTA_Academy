# 🔒 Guide de Sécurisation pour Production

## ⚠️ Actions CRITIQUES à effectuer avant la mise en production

### 1. Changer les secrets et mots de passe

**Base de données PostgreSQL:**
```yaml
# Dans docker-compose.yml, remplacez:
POSTGRES_PASSWORD: postgres  # ❌ NE PAS UTILISER EN PROD
# Par un mot de passe fort généré aléatoirement
```

**MinIO:**
```yaml
# Dans docker-compose.yml, remplacez:
MINIO_ROOT_USER: minioadmin      # ❌ NE PAS UTILISER EN PROD
MINIO_ROOT_PASSWORD: minioadmin  # ❌ NE PAS UTILISER EN PROD
```

**JWT Secret:**
```yaml
# Dans docker-compose.yml, remplacez:
JWT_SECRET: your-very-secure-secret-key-change-this-in-production-minimum-512-bits
# Par une clé générée avec:
# openssl rand -base64 64
```

### 2. Configurer un reverse proxy avec SSL (HTTPS)

**Installer Nginx sur le VPS (en dehors de Docker):**
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

**Obtenir un certificat SSL gratuit:**
```bash
# Remplacer yourdomain.com par votre nom de domaine
sudo certbot --nginx -d yourdomain.com
```

**Configuration Nginx pour reverse proxy:**
```nginx
# /etc/nginx/sites-available/lsta-academy
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Restreindre CORS aux domaines de production

**Dans `SecurityConfig.java`:**
```java
configuration.setAllowedOrigins(Arrays.asList(
    "https://yourdomain.com",           // Production domain
    "http://localhost:80",              // Local testing
    "http://localhost:5173"             // Dev server
));
```

### 4. Configurer le firewall

```bash
# Autoriser SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquer les ports Docker (accès uniquement via reverse proxy)
sudo ufw deny 8080/tcp
# Port 80 est déjà autorisé ci-dessus pour HTTP
sudo ufw deny 9000/tcp
sudo ufw deny 9001/tcp
sudo ufw deny 5432/tcp

# Activer le firewall
sudo ufw enable
```

### 5. Variables d'environnement pour production

**Créer `.env.production` sur le VPS:**
```bash
# Base de données
POSTGRES_PASSWORD=<généré-avec-openssl-rand-base64-32>
SPRING_DATASOURCE_PASSWORD=<même-mot-de-passe>

# MinIO
MINIO_ROOT_USER=<nom-utilisateur-unique>
MINIO_ROOT_PASSWORD=<généré-avec-openssl-rand-base64-32>
MINIO_ACCESS_KEY=<nom-utilisateur-unique>
MINIO_SECRET_KEY=<généré-avec-openssl-rand-base64-32>

# JWT
JWT_SECRET=<généré-avec-openssl-rand-base64-64>

# URLs publiques
APP_BASE_URL=https://yourdomain.com
MINIO_SERVER_URL=https://yourdomain.com/minio
```

### 6. Activer les logs et monitoring

**Configurer la rotation des logs:**
```yaml
# Dans docker-compose.yml, ajouter pour chaque service:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 7. Sauvegardes automatiques

**Script de sauvegarde PostgreSQL:**
```bash
#!/bin/bash
# /root/backup-db.sh
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker exec school-management-db pg_dump -U postgres schoolmanagement > $BACKUP_DIR/db_$DATE.sql
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

**Cron job (sauvegardes quotidiennes à 2h du matin):**
```bash
crontab -e
# Ajouter:
0 2 * * * /root/backup-db.sh
```

### 8. Mettre à jour l'application

**Script de déploiement sécurisé:**
```bash
cd ~/LSTA_Academy/Projet_LSTA_Academy
git pull origin main
docker compose down
docker compose up -d --build
docker image prune -f
```

---

## ✅ Checklist de production

- [ ] Tous les mots de passe par défaut ont été changés
- [ ] SSL/HTTPS configuré avec Let's Encrypt
- [ ] Firewall configuré (UFW)
- [ ] CORS restreint au domaine de production
- [ ] Variables d'environnement sécurisées
- [ ] Rotation des logs configurée
- [ ] Sauvegardes automatiques configurées
- [ ] Domaine configuré (DNS pointant vers le VPS)
- [ ] Ports Docker non exposés publiquement
- [ ] Monitoring configuré (optionnel: Grafana, Prometheus)

---

## 🔗 URLs après configuration complète

- **Frontend**: https://yourdomain.com
- **Backend API**: https://yourdomain.com/api
- **MinIO Console**: https://yourdomain.com/minio (via reverse proxy)
