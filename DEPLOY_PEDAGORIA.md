# 🚀 Déploiement de pedagoria.com sur VPS

## Prérequis

1. **DNS configuré** : `pedagoria.com` et `www.pedagoria.com` doivent pointer vers `57.129.110.129`
2. **Accès SSH** au VPS : `ssh debian@57.129.110.129`
3. **Ports ouverts** : 80 (HTTP) et 443 (HTTPS)

## Vérification DNS

Avant de commencer, vérifiez que votre DNS est bien configuré :

```bash
# Sur votre machine locale
nslookup pedagoria.com
nslookup www.pedagoria.com

# Les deux doivent pointer vers 57.129.110.129
```

## Étape 1 : Connexion au VPS

```bash
ssh debian@57.129.110.129
```

## Étape 2 : Mise à jour du code

```bash
cd ~/LSTA_Academy/Projet_LSTA_Academy
git pull origin test_prod
```

## Étape 3 : Configuration SSL automatique

```bash
# Copier le script de configuration SSL
sudo bash setup-ssl.sh
```

Le script va :
- ✅ Installer Nginx et Certbot
- ✅ Configurer Nginx comme reverse proxy
- ✅ Obtenir un certificat SSL gratuit de Let's Encrypt
- ✅ Configurer le renouvellement automatique du certificat

## Étape 4 : Démarrer les conteneurs Docker

```bash
# Arrêter les conteneurs existants
docker compose down

# Reconstruire et démarrer
docker compose up -d --build

# Vérifier que tout fonctionne
docker compose ps
```

## Étape 5 : Vérification

```bash
# Vérifier les logs
docker compose logs -f frontend
docker compose logs -f backend

# Vérifier Nginx
sudo nginx -t
sudo systemctl status nginx
```

## Accès à l'application

Une fois le déploiement terminé :

- **Frontend** : https://pedagoria.com
- **Backend API** : https://pedagoria.com/api
- **MinIO Console** : http://57.129.110.129:9001

## Configuration manuelle (si le script automatique ne fonctionne pas)

### 1. Installer Nginx et Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Créer la configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/pedagoria
```

Coller le contenu de `nginx-vps-config.conf`

### 3. Activer le site

```bash
sudo ln -s /etc/nginx/sites-available/pedagoria /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Obtenir le certificat SSL

```bash
sudo certbot --nginx -d pedagoria.com -d www.pedagoria.com
```

Suivez les instructions de Certbot.

### 5. Tester le renouvellement automatique

```bash
sudo certbot renew --dry-run
```

## Firewall (Recommandé)

```bash
# Autoriser SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquer l'accès direct aux ports Docker
sudo ufw deny 8080/tcp
sudo ufw deny 9000/tcp
sudo ufw deny 9001/tcp
sudo ufw deny 5432/tcp

# Activer le firewall
sudo ufw enable
```

## Monitoring et logs

```bash
# Logs Nginx
sudo tail -f /var/log/nginx/pedagoria-access.log
sudo tail -f /var/log/nginx/pedagoria-error.log

# Logs Docker
docker compose logs -f

# Statut des conteneurs
docker compose ps

# Utilisation des ressources
docker stats
```

## Renouvellement SSL

Le certificat SSL se renouvelle automatiquement via un cron job créé par Certbot.

Pour tester manuellement :
```bash
sudo certbot renew
```

## Dépannage

### Le site n'est pas accessible

```bash
# Vérifier que Nginx fonctionne
sudo systemctl status nginx

# Vérifier que les conteneurs sont up
docker compose ps

# Vérifier les logs
sudo tail -100 /var/log/nginx/pedagoria-error.log
docker compose logs backend --tail=50
```

### Erreur de certificat SSL

```bash
# Renouveler le certificat
sudo certbot renew --force-renewal

# Recharger Nginx
sudo systemctl reload nginx
```

### Le backend ne répond pas

```bash
# Vérifier les logs backend
docker compose logs backend --tail=100

# Redémarrer le backend
docker compose restart backend
```

## Mise à jour de l'application

```bash
cd ~/LSTA_Academy/Projet_LSTA_Academy
git pull origin test_prod
docker compose down
docker compose up -d --build
docker image prune -f
```

## Sauvegarde

### Base de données

```bash
# Créer une sauvegarde manuelle
docker exec school-management-db pg_dump -U postgres schoolmanagement > backup_$(date +%Y%m%d).sql

# Restaurer une sauvegarde
cat backup_20231115.sql | docker exec -i school-management-db psql -U postgres schoolmanagement
```

### Automatiser les sauvegardes

Ajouter dans crontab :
```bash
crontab -e
# Ajouter cette ligne pour une sauvegarde quotidienne à 2h du matin
0 2 * * * docker exec school-management-db pg_dump -U postgres schoolmanagement > /root/backups/db_$(date +\%Y\%m\%d).sql
```

---

## ✅ Checklist finale

- [ ] DNS configuré (pedagoria.com → 57.129.110.129)
- [ ] SSL configuré avec Let's Encrypt
- [ ] Nginx reverse proxy actif
- [ ] Conteneurs Docker en cours d'exécution
- [ ] Frontend accessible sur https://pedagoria.com
- [ ] API accessible sur https://pedagoria.com/api
- [ ] Firewall configuré
- [ ] Sauvegardes automatiques configurées
- [ ] Logs accessibles et surveillés

---

**🎉 Votre application est maintenant en production sur https://pedagoria.com !**
