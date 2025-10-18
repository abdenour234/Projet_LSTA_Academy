# 🔧 Résolution du Problème "Invalid Credentials" SuperAdmin

## Le Problème

Votre ami obtient l'erreur **"Invalid credentials"** quand il essaie de se connecter avec `admin@admin.com` / `admin`.

## La Cause

Le compte SuperAdmin n'existe pas dans sa base de données locale. Après avoir cloné le projet et démarré Docker, la base de données est vide.

## ✅ Solution Rapide (Automatique)

### Windows (PowerShell):
```powershell
.\setup.ps1
```

### Linux/Mac (Bash):
```bash
chmod +x setup.sh
./setup.sh
```

Ces scripts vont:
1. Vérifier que Docker est démarré
2. Démarrer les conteneurs si nécessaire
3. **Créer automatiquement le compte SuperAdmin**
4. Afficher les identifiants de connexion

## 🛠 Solution Manuelle (Si le script ne fonctionne pas)

### Étape 1: Vérifier que les conteneurs sont démarrés

```bash
docker-compose ps
```

Vous devriez voir 4 conteneurs avec status "Up":
- school-management-backend
- school-management-frontend
- school-management-db
- school-management-minio

Si ce n'est pas le cas:
```bash
docker-compose up -d
```

### Étape 2: Créer le compte SuperAdmin

**Option A - Via fichier SQL:**
```bash
# Depuis le dossier du projet
docker exec -i school-management-db psql -U postgres -d schoolmanagement < setup-superadmin.sql
```

**Option B - Via commande directe:**
```bash
# Se connecter à PostgreSQL
docker exec -it school-management-db psql -U postgres -d schoolmanagement

# Puis copier-coller ce SQL:
INSERT INTO schools (name, address, city, region, level, type, phone, email, created_at, updated_at)
VALUES ('Pasteur', 'Avenue Mohammed V', 'Oujda', 'L''Oriental', 'Primaire', 'Privé', '0536123456', 'contact@pasteur.ma', NOW(), NOW())
ON CONFLICT DO NOTHING;

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

# Quitter
\q
```

### Étape 3: Vérifier la création

```bash
docker exec -it school-management-db psql -U postgres -d schoolmanagement -c "SELECT id, full_name, email, role FROM users WHERE email = 'admin@admin.com';"
```

Vous devriez voir:
```
 id | full_name   | email           | role
----+-------------+-----------------+------------
  X | Super Admin | admin@admin.com | superadmin
```

### Étape 4: Se connecter

1. Ouvrir http://localhost
2. Cliquer sur "Connexion"
3. Utiliser:
   - Email: `admin@admin.com`
   - Mot de passe: `admin`

## 🔍 Vérifications Supplémentaires

### Vérifier que le backend fonctionne

```bash
# Voir les logs du backend
docker logs -f school-management-backend

# Tester l'API
curl http://localhost:8080/actuator/health
```

### Vérifier la connexion à la base de données

```bash
# Se connecter à la base
docker exec -it school-management-db psql -U postgres -d schoolmanagement

# Lister les tables
\dt

# Compter les utilisateurs
SELECT COUNT(*) FROM users;

# Voir tous les utilisateurs
SELECT id, full_name, email, role FROM users;
```

### Réinitialiser complètement (Si tout échoue)

⚠️ **ATTENTION**: Cela supprimera toutes les données!

```bash
# Arrêter et supprimer tous les conteneurs et volumes
docker-compose down -v

# Reconstruire et redémarrer
docker-compose up -d --build

# Attendre 30 secondes que la base démarre
# Windows:
Start-Sleep -Seconds 30

# Linux/Mac:
sleep 30

# Recréer le SuperAdmin
docker exec -i school-management-db psql -U postgres -d schoolmanagement < setup-superadmin.sql
```

## 📧 Autres Problèmes Courants

### "Cannot connect to backend"

**Solution:**
```bash
# Vérifier les logs du backend
docker logs school-management-backend

# Redémarrer le backend
docker-compose restart backend
```

### "Page not found" sur http://localhost

**Solution:**
```bash
# Vérifier que le frontend est démarré
docker-compose ps

# Redémarrer le frontend
docker-compose restart frontend
```

### "Connection refused" sur PostgreSQL

**Solution:**
```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Voir les logs
docker logs school-management-db

# Redémarrer PostgreSQL
docker-compose restart postgres
```

## 📞 Aide Supplémentaire

Si le problème persiste après avoir suivi ces étapes:

1. Partagez les logs:
   ```bash
   docker-compose logs > logs.txt
   ```

2. Vérifiez la version de Docker:
   ```bash
   docker --version
   docker-compose --version
   ```

3. Vérifiez l'espace disque disponible

4. Consultez le [SETUP_GUIDE.md](SETUP_GUIDE.md) complet

## ✅ Checklist de Vérification

- [ ] Docker Desktop est démarré
- [ ] Les 4 conteneurs sont "Up" (`docker-compose ps`)
- [ ] Le compte SuperAdmin a été créé
- [ ] Le backend est accessible (http://localhost:8080)
- [ ] Le frontend est accessible (http://localhost)
- [ ] Les identifiants sont corrects: `admin@admin.com` / `admin`

Une fois toutes ces cases cochées, la connexion devrait fonctionner! 🎉
