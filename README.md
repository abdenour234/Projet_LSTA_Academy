# 🎓 School Management Platform# 🎓 Projet LSTA Academy - School Management System



A comprehensive educational management system for schools to manage students, teachers, classes, activities, and teaching sessions.Système de gestion scolaire complet avec dashboard SuperAdmin, gestion des activités, diagnostics et suivi des élèves.



## 📚 Documentation## 📋 Table des Matières



This project includes three comprehensive documentation files:- [Guide de Configuration](#-guide-de-configuration)

- [Fonctionnalités](#-fonctionnalités)

1. **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete project overview, architecture, file structure, and workflows- [Stack Technique](#-stack-technique)

2. **[DATABASE_DOCUMENTATION.md](./DATABASE_DOCUMENTATION.md)** - Full database schema, relationships, queries, and maintenance- [Architecture](#-architecture)

3. **[TECHNOLOGIES.md](./TECHNOLOGIES.md)** - Detailed explanation of all technologies, frameworks, and libraries used- [Développement](#-développement)

- [Documentation](#-documentation)

## 🚀 Quick Start

## 🚀 Guide de Configuration

```bash

# Clone the repository### Installation Rapide

git clone <repository-url>

cd insight-bloom-ed-06780-42905-49682-99516**Pour Windows (PowerShell):**

```powershell

# Start all services with Docker Compose# Cloner le projet

docker-compose up -dgit clone https://github.com/abdenour234/Projet_LSTA_Academy.git

cd Projet_LSTA_Academy

# Wait for services to be healthy (~30 seconds)

# Lancer le script de setup automatique

# Access the application.\setup.ps1

# Frontend: http://localhost:80```

# Backend API: http://localhost:8080

# MinIO Console: http://localhost:9001**Pour Linux/Mac (Bash):**

``````bash

# Cloner le projet

## 🔑 Default Credentialsgit clone https://github.com/abdenour234/Projet_LSTA_Academy.git

cd Projet_LSTA_Academy

**SuperAdmin Account:**

- Email: `admin@superadmin.com`# Rendre le script exécutable et le lancer

- Password: `SuperAdmin@2024`chmod +x setup.sh

./setup.sh

## 🛠️ Tech Stack```



- **Backend**: Spring Boot 3.3.5 (Java 17)### Configuration Manuelle

- **Frontend**: React 18.3.1 + TypeScript 5.5.3

- **Database**: PostgreSQL 15Si vous préférez configurer manuellement, consultez le [**SETUP_GUIDE.md**](SETUP_GUIDE.md) pour les instructions détaillées.

- **Storage**: MinIO (S3-compatible)

- **Build Tools**: Maven (Backend), Vite (Frontend)### 🔐 Identifiants par Défaut

- **Container**: Docker + Docker Compose

**SuperAdmin:**

## 📖 Read the Documentation- Email: `admin@admin.com`

- Mot de passe: `admin`

For detailed information about:

- Project architecture and structure## ✨ Fonctionnalités

- Database schema and relationships  

- Technology choices and usage### SuperAdmin

- API endpoints and workflows- ✅ Dashboard global avec statistiques

- Development setup and deployment- ✅ Gestion des écoles

- ✅ Création et distribution d'activités pédagogiques

Please refer to the three documentation files mentioned above.- ✅ Vue détaillée de chaque école

- ✅ Suivi des performances globales

## 📄 License

### Admin d'École

Proprietary software. All rights reserved.- ✅ Dashboard spécifique à l'école

- ✅ Gestion des enseignants

---- ✅ Gestion des classes

- ✅ Suivi des activités

**Last Updated**: October 19, 2025- ✅ Messagerie interne


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
| Frontend | http://localhost:80 | Interface utilisateur |
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
