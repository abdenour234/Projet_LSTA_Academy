# Guide de connexion pgAdmin à PostgreSQL

Ce guide explique comment connecter pgAdmin à la base de données PostgreSQL conteneurisée du projet.

---

## 📋 Prérequis

- Docker et Docker Compose installés et en cours d'exécution
- Les conteneurs du projet démarrés avec `docker-compose up -d`
- pgAdmin 4 installé sur votre machine ([Télécharger pgAdmin](https://www.pgadmin.org/download/))

---

## 🚀 Méthode 1: Connexion depuis pgAdmin installé localement

### Étape 1: Démarrer les conteneurs

```bash
docker-compose up -d
```

Vérifiez que PostgreSQL est démarré:
```bash
docker ps | findstr school-management-db
```

### Étape 2: Récupérer les informations de connexion

Les informations de connexion se trouvent dans `docker-compose.yml`:

```yaml
postgres:
  image: postgres:16
  container_name: school-management-db
  environment:
    POSTGRES_DB: schoolmanagement
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  ports:
    - "5432:5432"
```

**Informations importantes:**
- **Host**: `localhost` (car le port 5432 est exposé)
- **Port**: `5432`
- **Database**: `schoolmanagement`
- **Username**: `postgres`
- **Password**: `postgres`

### Étape 3: Ouvrir pgAdmin

1. Lancez pgAdmin 4 sur votre machine
2. Créez un mot de passe maître si c'est votre première utilisation

### Étape 4: Ajouter un nouveau serveur

1. **Clic droit** sur "Servers" dans le panneau de gauche
2. Sélectionnez **"Register" → "Server..."**

### Étape 5: Configuration de la connexion

#### Onglet "General"
- **Name**: `School Management (Local)`
- **Comment**: `Base de données du projet School Management`

#### Onglet "Connection"
- **Host name/address**: `localhost`
- **Port**: `5432`
- **Maintenance database**: `schoolmanagement`
- **Username**: `postgres`
- **Password**: `postgres`
- ✅ **Cochez "Save password"** (optionnel, pour ne pas retaper à chaque fois)

#### Onglet "Advanced" (optionnel)
- **DB restriction**: `schoolmanagement` (pour afficher uniquement cette base)

### Étape 6: Sauvegarder et tester

1. Cliquez sur **"Save"**
2. pgAdmin va se connecter automatiquement
3. Vous devriez voir le serveur apparaître dans l'arbre à gauche

### ✅ Vérification

Naviguez dans l'arbre:
```
School Management (Local)
  └─ Databases
      └─ schoolmanagement
          └─ Schemas
              └─ public
                  └─ Tables
                      ├─ profiles
                      ├─ schools
                      ├─ user_roles
                      ├─ activities
                      └─ ... (autres tables)
```

---

## 🐳 Méthode 2: Utiliser pgAdmin dans Docker (recommandé pour les équipes)

Cette méthode ajoute pgAdmin comme conteneur Docker, accessible via navigateur.

### Étape 1: Ajouter pgAdmin au docker-compose.yml

Ajoutez ce service dans votre `docker-compose.yml`:

```yaml
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: school-management-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@admin.com
      PGADMIN_DEFAULT_PASSWORD: admin
      PGADMIN_CONFIG_SERVER_MODE: 'False'
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - app-network
    volumes:
      - pgadmin_data:/var/lib/pgadmin
```

Et ajoutez le volume correspondant:

```yaml
volumes:
  postgres_data:
  minio_data:
  pgadmin_data:  # Nouveau volume
```

### Étape 2: Démarrer les conteneurs

```bash
docker-compose down
docker-compose up -d
```

### Étape 3: Accéder à pgAdmin

1. Ouvrez votre navigateur
2. Allez sur **http://localhost:5050**
3. Connectez-vous avec:
   - **Email**: `admin@admin.com`
   - **Password**: `admin`

### Étape 4: Ajouter le serveur PostgreSQL

1. Cliquez sur **"Add New Server"**

#### Onglet "General"
- **Name**: `School Management DB`

#### Onglet "Connection"
- **Host name/address**: `postgres` ⚠️ (nom du service, pas localhost!)
- **Port**: `5432`
- **Maintenance database**: `schoolmanagement`
- **Username**: `postgres`
- **Password**: `postgres`
- ✅ **Cochez "Save password"**

### Étape 5: Sauvegarder

Cliquez sur **"Save"** et vous êtes connecté!

---

## 🔍 Requêtes SQL utiles

Une fois connecté, vous pouvez exécuter ces requêtes pour explorer les données:

### Voir tous les profils (utilisateurs)
```sql
SELECT 
    p.email, 
    p.full_name, 
    p.school_id, 
    ur.role 
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id;
```

### Voir toutes les écoles
```sql
SELECT 
    id, 
    name, 
    city, 
    region, 
    level, 
    status, 
    students 
FROM schools
ORDER BY name;
```

### Vérifier le SuperAdmin
```sql
SELECT 
    p.email, 
    p.full_name, 
    ur.role 
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'superadmin';
```

### Voir toutes les activités créées
```sql
SELECT 
    a.title,
    a.subject,
    a.type,
    a.difficulty,
    s.name as school_name,
    a.created_at
FROM activities a
JOIN schools s ON s.id::text = a.school_id
ORDER BY a.created_at DESC;
```

### Compter les utilisateurs par rôle
```sql
SELECT 
    ur.role, 
    COUNT(*) as count
FROM user_roles ur
GROUP BY ur.role
ORDER BY count DESC;
```

---

## 🛠️ Dépannage

### Problème: "Could not connect to server"

**Solution 1: Vérifier que PostgreSQL est démarré**
```bash
docker ps | findstr school-management-db
```

Si le conteneur n'apparaît pas:
```bash
docker-compose up -d postgres
```

**Solution 2: Vérifier les logs**
```bash
docker logs school-management-db
```

**Solution 3: Redémarrer PostgreSQL**
```bash
docker-compose restart postgres
```

### Problème: "Connection refused on port 5432"

**Vérifier que le port est bien exposé:**
```bash
docker port school-management-db
```

Devrait afficher:
```
5432/tcp -> 0.0.0.0:5432
```

**Si le port est utilisé par une autre application:**
- Modifiez le port dans `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Utilisez 5433 au lieu de 5432
```
- Puis dans pgAdmin, utilisez le port `5433`

### Problème: "Password authentication failed"

Vérifiez que vous utilisez:
- **Username**: `postgres`
- **Password**: `postgres`

Si le problème persiste, recréez le conteneur:
```bash
docker-compose down -v
docker-compose up -d
```

⚠️ **Attention**: `-v` supprime les volumes (données perdues)

### Problème: pgAdmin dans Docker ne se connecte pas au serveur

Si vous utilisez la Méthode 2 (pgAdmin dockerisé), utilisez:
- **Host**: `postgres` (nom du service Docker, pas `localhost`)
- **Port**: `5432` (port interne, pas le port exposé)

---

## 📊 Avantages de chaque méthode

### Méthode 1: pgAdmin local
✅ Interface native plus rapide
✅ Pas de ressources Docker supplémentaires
✅ Idéal pour développement solo
❌ Nécessite installation sur chaque machine

### Méthode 2: pgAdmin dockerisé
✅ Aucune installation locale nécessaire
✅ Configuration partagée dans docker-compose
✅ Idéal pour les équipes
✅ Accessible depuis n'importe quel navigateur
❌ Consomme un peu plus de mémoire

---

## 🔒 Sécurité en production

⚠️ **Important**: Les identifiants actuels sont pour le développement uniquement!

En production, changez:
```yaml
environment:
  POSTGRES_PASSWORD: ${DB_PASSWORD}  # Variable d'environnement sécurisée
  PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_PASSWORD}
```

Et utilisez un fichier `.env` (non versionné):
```env
DB_PASSWORD=un-mot-de-passe-tres-securise
PGADMIN_PASSWORD=un-autre-mot-de-passe-securise
```

---

## 📚 Ressources supplémentaires

- [Documentation pgAdmin](https://www.pgadmin.org/docs/)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Docker PostgreSQL Image](https://hub.docker.com/_/postgres)
- [Docker pgAdmin Image](https://hub.docker.com/r/dpage/pgadmin4)

---

**Bon développement! 🚀**
