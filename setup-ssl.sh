#!/bin/bash
# Script de configuration SSL pour pedagoria.com sur VPS
# À exécuter sur le VPS en tant que root ou avec sudo

set -e

echo "🔒 Configuration SSL pour pedagoria.com"
echo "========================================"
echo ""

# Vérifier si on est root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Ce script doit être exécuté en tant que root"
    echo "Utilisez: sudo bash setup-ssl.sh"
    exit 1
fi

# Installer Nginx et Certbot
echo "📦 Installation de Nginx et Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Créer la configuration Nginx
echo "📝 Création de la configuration Nginx..."
cat > /etc/nginx/sites-available/pedagoria << 'EOF'
# Configuration temporaire pour obtenir le certificat SSL
server {
    listen 80;
    listen [::]:80;
    server_name pedagoria.com www.pedagoria.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Activer le site
echo "✅ Activation du site..."
ln -sf /etc/nginx/sites-available/pedagoria /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
echo "🔍 Test de la configuration Nginx..."
nginx -t

# Recharger Nginx
echo "🔄 Rechargement de Nginx..."
systemctl reload nginx

# Obtenir le certificat SSL
echo ""
echo "🔐 Obtention du certificat SSL Let's Encrypt..."
echo "⚠️  Assurez-vous que pedagoria.com pointe vers cette IP: $(curl -s ifconfig.me)"
read -p "Continuer? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d pedagoria.com -d www.pedagoria.com --non-interactive --agree-tos --email admin@pedagoria.com
    
    # Mettre à jour la configuration avec SSL
    echo "📝 Mise à jour de la configuration avec SSL..."
    cat > /etc/nginx/sites-available/pedagoria << 'EOF'
# HTTP - Redirection vers HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name pedagoria.com www.pedagoria.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS - Configuration principale
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pedagoria.com www.pedagoria.com;

    ssl_certificate /etc/letsencrypt/live/pedagoria.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pedagoria.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    access_log /var/log/nginx/pedagoria-access.log;
    error_log /var/log/nginx/pedagoria-error.log;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
    
    # Recharger Nginx
    nginx -t && systemctl reload nginx
    
    echo ""
    echo "✅ Configuration SSL terminée avec succès!"
    echo ""
    echo "🔗 Votre site est maintenant accessible sur:"
    echo "   https://pedagoria.com"
    echo "   https://www.pedagoria.com"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "   1. Vérifiez que vos conteneurs Docker sont en cours d'exécution"
    echo "   2. Testez l'accès à https://pedagoria.com"
    echo "   3. Le certificat SSL se renouvellera automatiquement"
else
    echo "❌ Installation annulée"
    exit 1
fi
