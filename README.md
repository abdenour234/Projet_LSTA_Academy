# 🎓 Projet LSTA Academy - School Management System

Système de gestion scolaire complet avec dashboard SuperAdmin, gestion des activités, diagnostics et suivi des élèves.

## 📋 Table des Matières

- [Guide de Configuration](#-guide-de-configuration)
- [Fonctionnalités](#-fonctionnalités)
- [Stack Technique](#-stack-technique)
- [Architecture](#-architecture)
- [Développement](#-développement)
- [Documentation](#-documentation)

## 🚀 Guide de Configuration

### Installation Rapide

**Pour Windows (PowerShell):**
```powershell
# Cloner le projet
git clone https://github.com/abdenour234/Projet_LSTA_Academy.git
cd Projet_LSTA_Academy

# Lancer le script de setup automatique
.\setup.ps1
```

**Pour Linux/Mac (Bash):**
```bash
# Cloner le projet
git clone https://github.com/abdenour234/Projet_LSTA_Academy.git
cd Projet_LSTA_Academy

# Rendre le script exécutable et le lancer
chmod +x setup.sh
./setup.sh
```

### Configuration Manuelle

Si vous préférez configurer manuellement, consultez le [**SETUP_GUIDE.md**](SETUP_GUIDE.md) pour les instructions détaillées.

### 🔐 Identifiants par Défaut

**SuperAdmin:**
- Email: `admin@admin.com`
- Mot de passe: `admin`

## ✨ Fonctionnalités

### SuperAdmin
- ✅ Dashboard global avec statistiques
- ✅ Gestion des écoles
- ✅ Création et distribution d'activités pédagogiques
- ✅ Vue détaillée de chaque école
- ✅ Suivi des performances globales

### Admin d'École
- ✅ Dashboard spécifique à l'école
- ✅ Gestion des enseignants
- ✅ Gestion des classes
- ✅ Suivi des activités
- ✅ Messagerie interne

### Enseignant
- ✅ Dashboard personnel
- ✅ Gestion des sessions de diagnostic
- ✅ Suivi des élèves
- ✅ Accès aux activités pédagogiques
- ✅ Création de sessions

### Étudiant
- 🚧 Dashboard (en développement)
- 🚧 Accès aux activités
- 🚧 Suivi de progression

## 🛠 Stack Technique

### Frontend
- **React** 18 + TypeScript
- **Vite** - Build tool
- **React Router** - Navigation
- **Shadcn UI** - Composants UI
- **Tailwind CSS** - Styling
- **Lucide React** - Icônes

### Backend
- **Spring Boot** 3.2.0
- **Java** 17
- **Spring Security** - Authentification/Autorisation
- **Spring Data JPA** - ORM
- **PostgreSQL** - Base de données
- **BCrypt** - Hachage des mots de passe

### Infrastructure
- **Docker** & Docker Compose
- **PostgreSQL** 16
- **MinIO** - Stockage d'objets
- **Nginx** - Serveur web frontend

## 📁 Architecture

```
Projet_LSTA_Academy/
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   ├── lib/           # Utilitaires et API
│   │   └── types/         # Types TypeScript
│   └── Dockerfile
│
├── backend/               # Application Spring Boot
│   ├── src/main/java/
│   │   └── com/schoolmanagement/
│   │       ├── controller/  # Contrôleurs REST
│   │       ├── service/     # Logique métier
│   │       ├── repository/  # Accès aux données
│   │       ├── model/       # Modèles de données
│   │       ├── entity/      # Entités JPA
│   │       └── security/    # Configuration sécurité
│   └── Dockerfile
│
├── supabase/              # Migrations SQL
│   └── migrations/
│
├── docker-compose.yml     # Configuration Docker
├── setup.ps1              # Script de setup Windows
├── setup.sh               # Script de setup Linux/Mac
├── setup-superadmin.sql   # Script SQL SuperAdmin
├── SETUP_GUIDE.md         # Guide de configuration détaillé
└── GIT_WORKFLOW.md        # Guide du workflow Git
```

## 💻 Développement

### Prérequis
- Docker Desktop
- Git
- Node.js 18+ (pour développement frontend local)
- Java 17+ (pour développement backend local)

### Workflow Git

Nous utilisons un workflow Git Flow avec deux branches principales:
- `main` - Production (stable)
- `develop` - Développement (source de toutes les features)

Consultez [**GIT_WORKFLOW.md**](GIT_WORKFLOW.md) pour les détails complets.

### Commandes Utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Reconstruire après modifications
docker-compose up -d --build

# Arrêter tous les services
docker-compose down

# Accéder à la base de données
docker exec -it school-management-db psql -U postgres -d schoolmanagement
```

## 📚 Documentation

- [**SETUP_GUIDE.md**](SETUP_GUIDE.md) - Guide de configuration complet
- [**GIT_WORKFLOW.md**](GIT_WORKFLOW.md) - Workflow Git et conventions
- [**DOCUMENTATION.md**](DOCUMENTATION.md) - Documentation technique

## 🔗 URLs des Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost | Interface utilisateur |
| Backend API | http://localhost:8080 | API REST |
| PostgreSQL | localhost:5432 | Base de données |
| MinIO | http://localhost:9000 | Stockage d'objets |

## 🤝 Contribution

1. Cloner le projet
2. Créer une branche depuis `develop`: `git checkout -b feat/ma-feature`
3. Commiter les changements: `git commit -m "feat: description"`
4. Pousser la branche: `git push origin feat/ma-feature`
5. Créer une Pull Request vers `develop`

## 📝 License

Ce projet est sous licence privée - tous droits réservés.

## 👥 Équipe

- **Development Team** - LSTA Academy

---

**🎉 Bon développement!**
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b0588786-61b8-4ad5-82a4-c8158ac08c66) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
