# 🚀 Guide de Configuration - Projet LSTA Academy

## Prérequis

- Docker Desktop installé et démarré
- Git installé
- Un éditeur de code (VS Code recommandé)

## 📥 Étape 1: Cloner le Projet

```bash
git clone https://github.com/abdenour234/Projet_LSTA_Academy.git
cd Projet_LSTA_Academy

# Se positionner sur la branche develop
git checkout develop
```

## 🐳 Étape 2: Démarrer les Conteneurs Docker

```bash
# Construire et démarrer tous les conteneurs
docker-compose up -d

# Vérifier que tous les conteneurs sont démarrés
docker-compose ps
```

**Vous devriez voir 4 conteneurs en status "Up":**
- `school-management-backend` (port 8080)
- `school-management-frontend` (port 80)
- `school-management-db` (port 5432)
- `school-management-minio` (ports 9000-9001)

## 📊 Étape 3: Créer le Compte SuperAdmin

⚠️ **IMPORTANT**: Cette étape est obligatoire pour pouvoir se connecter!

### Option A: Via Script SQL Direct

```bash
# Connecter à la base de données PostgreSQL
docker exec -it school-management-db psql -U postgres -d schoolmanagement
```

Puis exécuter le SQL suivant dans le terminal PostgreSQL:

```sql
-- Créer une école de test (si pas déjà créée)
INSERT INTO schools (name, address, city, region, level, type, phone, email, created_at, updated_at)
VALUES ('Pasteur', 'Avenue Mohammed V', 'Oujda', 'L''Oriental', 'Primaire', 'Privé', '0536123456', 'contact@pasteur.ma', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Créer le compte SuperAdmin
-- Mot de passe: admin (hashé avec BCrypt)
INSERT INTO users (full_name, email, password, role, school_id, is_active, created_at, updated_at)
VALUES (
    'Super Admin',
    'admin@admin.com',
    '$2a$10$xvNHQYZBwlH7OzvGxkxhUOQRMlVSHIVHzLxQjz3cjKUmjGRjKWn0K',
    'superadmin',
    1,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- Quitter psql
\q
```

### Option B: Via Script Automatique (Recommandé)

Créer un fichier `setup-superadmin.sql` avec le contenu ci-dessus, puis:

```bash
docker exec -i school-management-db psql -U postgres -d schoolmanagement < setup-superadmin.sql
```

## 🔐 Étape 4: Se Connecter

### Accéder à l'Application

Ouvrir votre navigateur et aller sur: **http://localhost**

### Identifiants SuperAdmin

```
Email: admin@admin.com
Mot de passe: admin
```

### Identifiants Admin d'École

Si vous avez créé un admin d'école via le signup:
```
Email: [celui que vous avez créé]
Mot de passe: [celui que vous avez défini]
```

## ❌ Résolution des Problèmes Courants

### Problème: "Invalid credentials" pour SuperAdmin

**Cause**: Le compte superadmin n'existe pas dans la base de données.

**Solution**: Suivre l'Étape 3 pour créer le compte.

### Problème: "Cannot connect to backend"

**Cause**: Le backend n'est pas démarré ou n'est pas prêt.

**Solution**:
```bash
# Vérifier les logs du backend
docker logs school-management-backend

# Redémarrer le backend si nécessaire
docker-compose restart backend
```

### Problème: "Page not found" sur http://localhost

**Cause**: Le frontend n'est pas démarré.

**Solution**:
```bash
# Redémarrer le frontend
docker-compose restart frontend

# Vérifier qu'il écoute sur le port 80
docker-compose ps
```

### Problème: Les conteneurs ne démarrent pas

**Solution**:
```bash
# Arrêter tous les conteneurs
docker-compose down

# Nettoyer les volumes (ATTENTION: efface la base de données)
docker-compose down -v

# Reconstruire et redémarrer
docker-compose up -d --build
```

## 🔄 Mise à Jour du Projet

```bash
# Se positionner sur develop
git checkout develop

# Récupérer les dernières modifications
git pull origin develop

# Reconstruire les conteneurs avec les nouvelles modifications
docker-compose down
docker-compose up -d --build

# Vérifier que tout fonctionne
docker-compose ps
```

## 📁 Structure des Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 80 | http://localhost |
| Backend | 8080 | http://localhost:8080 |
| PostgreSQL | 5432 | localhost:5432 |
| MinIO | 9000-9001 | http://localhost:9000 |

## 🧪 Test de l'Installation

1. **Ouvrir** http://localhost
2. **Cliquer** sur "Connexion" (en haut à droite)
3. **Se connecter** avec `admin@admin.com` / `admin`
4. **Vérifier** que vous êtes redirigé vers le SuperAdmin Dashboard
5. **Tester** la création d'une activité via "Nouvelle Activité"

## 🗄️ Commandes Utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Voir les logs d'un service spécifique
docker logs -f school-management-backend

# Accéder au conteneur backend
docker exec -it school-management-backend sh

# Accéder à la base de données
docker exec -it school-management-db psql -U postgres -d schoolmanagement

# Arrêter tous les conteneurs
docker-compose down

# Redémarrer un service spécifique
docker-compose restart backend

# Voir l'état des conteneurs
docker-compose ps

# Reconstruire sans cache
docker-compose build --no-cache
```

## 📧 Support

Si vous rencontrez des problèmes:

1. Vérifier les logs: `docker-compose logs -f`
2. Vérifier que tous les conteneurs sont "Up": `docker-compose ps`
3. Vérifier que le compte superadmin existe (Étape 3)
4. Redémarrer les conteneurs: `docker-compose restart`

## ⚙️ Configuration de Développement

Pour le développement local sans Docker:

### Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

**Note**: Vous devrez toujours avoir PostgreSQL et MinIO en cours d'exécution (via Docker ou localement).

---

**🎉 Votre installation est complète! Bon développement!**
