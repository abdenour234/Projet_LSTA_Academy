# 🔍 Analyse Complète du Projet - School Management Platform

**Date:** 29 Octobre 2025  
**Analyste:** GitHub Copilot  
**Objectif:** Comprendre l'architecture avant corrections RBAC

---

## 🎯 OBJECTIF GLOBAL DU PROJET

### Vision
Plateforme de gestion scolaire complète permettant la gestion multi-écoles avec:
- Gestion centralisée par un SuperAdmin
- Autonomie des administrateurs d'école
- Outils pédagogiques pour les enseignants
- Suivi des élèves

### Utilisateurs Cibles
1. **SuperAdmin** - Gestion de toutes les écoles
2. **Admin École** - Gestion d'une école spécifique
3. **Enseignant** - Gestion des activités et sessions d'enseignement
4. **Étudiant** - Consultation des activités (en cours de développement)

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Stack Technologique

#### Backend (Spring Boot)
```
Java 17 + Spring Boot 3.3.5
├── Spring Security + JWT → Authentification
├── Spring Data JPA → ORM
├── PostgreSQL 15 → Base de données
├── MinIO → Stockage S3 des fichiers
└── Maven → Build
```

#### Frontend (React)
```
React 18.3.1 + TypeScript 5.5.3
├── Vite → Build rapide
├── TanStack Query → Gestion état serveur
├── React Router → Routing
├── Axios → HTTP client
├── shadcn/ui + Tailwind → UI
└── Lucide React → Icônes
```

#### Infrastructure
```
Docker Compose
├── backend (Spring Boot:8080)
├── frontend (Nginx:80)
├── postgres (DB:5432)
└── minio (Storage:9000)
```

---

## 📊 MODÈLE DE DONNÉES

### Entités Principales

#### 1. **Schools** (Écoles)
- Gère les informations des écoles
- Clé: `id` (String/Text)
- Relation: 1 School → N Profiles (admins/teachers)

#### 2. **Profiles** (Comptes Utilisateurs)
- Tous les utilisateurs (sauf étudiants)
- Authentification via email/password
- Clé: `id` (UUID)
- Champs: email, password_hash, full_name, school_id
- **SuperAdmin**: school_id = NULL

#### 3. **UserRoles** (Rôles)
- Table de jonction User ↔ Role
- **IMPORTANT**: 1 utilisateur = 1 seul rôle
- Valeurs: SUPERADMIN, ADMIN, TEACHER, STUDENT
- **Problème identifié**: Enum DB vs Java était désynchronisé

#### 4. **Students** (Étudiants)
- Données élèves
- **IMPORTANT**: Lien avec authentification via `user_id`
- Relation: N Students → 1 Class

#### 5. **Classes** (Classes)
- Groupes d'élèves par niveau/filière
- Relation: 1 Class → N Students
- Relation: N Classes ↔ N Teachers (teacher_classes)

#### 6. **Activities** (Activités Pédagogiques)
- Ressources d'enseignement
- Types: Orale, Lecture, Écriture
- Layout: Mise en page flexible (JSON)
- Stockage fichiers: MinIO

#### 7. **ActivityFiles** (Fichiers)
- Métadonnées des fichiers uploadés
- Référence MinIO: bucket + object_name
- Types: Images, PDFs, Vidéos

#### 8. **TeachingSessions** (Sessions d'Enseignement)
- Enregistrement des cours donnés
- Liens: Teacher + Class + Activity
- Suivi: date, durée, présence

#### 9. **DiagnosticSessions** (Diagnostics)
- Évaluations des élèves
- Résultats par matière/niveau

---

## 🔐 SYSTÈME D'AUTHENTIFICATION & AUTORISATION

### Flow d'Authentification

```
1. USER → POST /api/auth/login {email, password}
   ↓
2. BACKEND → Vérifie credentials
   ↓
3. BACKEND → Récupère role depuis user_roles
   ↓
4. BACKEND → Génère JWT avec claims:
   - userId (UUID)
   - email
   - role (SUPERADMIN/ADMIN/TEACHER/STUDENT)
   - schoolId
   ↓
5. BACKEND → Retourne {token, user:{id, email, role, schoolId}}
   ↓
6. FRONTEND → Stocke token (localStorage)
   ↓
7. FRONTEND → Redirige selon rôle:
   - SUPERADMIN → /superadmin/dashboard
   - ADMIN → /school/{schoolId}/admin/dashboard
   - TEACHER → /school/{schoolId}/teacher/dashboard
   - STUDENT → /school/{schoolId}/student/dashboard
```

### Mécanisme d'Autorisation (Backend)

#### Niveau 1: SecurityConfig (URL Patterns)
```java
// Public
/api/auth/login, /api/auth/register → permitAll()

// Protected
/api/superadmin/** → hasRole("SUPERADMIN")
/api/students/** → hasAnyRole("SUPERADMIN","ADMIN","TEACHER","STUDENT")
/api/teachers/** → hasAnyRole("SUPERADMIN","ADMIN","TEACHER")
```

#### Niveau 2: @PreAuthorize (Méthodes)
```java
@PreAuthorize("hasRole('SUPERADMIN')")
public ResponseEntity createSchool() { ... }

@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
public ResponseEntity getStudents() { ... }
```

#### Niveau 3: OwnershipValidationService (Données)
```java
// Empêche accès cross-school
public void validateSchoolAccess(String schoolId, Authentication auth) {
    // SUPERADMIN → accès à tout
    // Autres → seulement leur school_id
}
```

### JWT Token Structure
```json
{
  "sub": "user@email.com",
  "userId": "uuid-here",
  "email": "user@email.com",
  "role": "ADMIN",
  "schoolId": "1",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Extraction Optimisée (Après Fix)
```
JwtAuthenticationFilter
  ↓ Parse JWT une seule fois
  ↓ Stocke dans UserAuthenticationDetails
  ↓ Attache à Authentication.details
  ↓
OwnershipValidationService
  ↓ Récupère directement depuis Authentication
  ↓ Pas de re-parsing JWT
```

---

## 🚀 FONCTIONNALITÉS PAR RÔLE

### SUPERADMIN
**Objectif:** Gestion globale multi-écoles

**Peut:**
- ✅ Créer/modifier/supprimer des écoles
- ✅ Voir toutes les données de toutes les écoles
- ✅ Créer des activités globales
- ✅ Gérer tous les utilisateurs
- ✅ Accéder aux statistiques globales

**Pages:**
- `/superadmin/dashboard` - Vue d'ensemble
- `/superadmin/schools/:id` - Détails école
- `/superadmin/activities/new` - Créer activité
- `/superadmin/activities/edit/:id` - Modifier activité

---

### ADMIN (Administrateur d'École)
**Objectif:** Gestion complète d'UNE école

**Peut:**
- ✅ Gérer les enseignants de son école
- ✅ Gérer les classes de son école
- ✅ Gérer les élèves de son école
- ✅ Voir les activités de son école
- ✅ Voir le suivi d'activité des enseignants
- ❌ NE PEUT PAS accéder aux autres écoles

**Pages:**
- `/school/:schoolId/admin/dashboard` - Tableau de bord école
- `/school/:schoolId/admin/teachers` - Gestion enseignants
- `/school/:schoolId/admin/classes` - Gestion classes
- `/school/:schoolId/admin/students` - Gestion élèves (via /school/:id/students)
- `/school/:schoolId/admin/activity-tracking` - Suivi activités

**Validation Importante:**
```java
// DOIT vérifier schoolId dans chaque requête
ownershipValidator.validateSchoolAccess(schoolId, authentication);
```

---

### TEACHER (Enseignant)
**Objectif:** Enseigner et suivre les élèves

**Peut:**
- ✅ Créer des sessions d'enseignement
- ✅ Voir les activités de son école
- ✅ Créer/modifier des activités pour son école
- ✅ Voir les élèves de son école
- ✅ Faire des diagnostics
- ✅ Envoyer des messages
- ❌ NE PEUT PAS gérer les enseignants/classes
- ❌ NE PEUT PAS accéder aux autres écoles

**Pages:**
- `/school/:schoolId/teacher/dashboard` - Tableau de bord enseignant
- `/school/:schoolId/teacher/sessions` - Mes sessions
- `/school/:schoolId/teacher/diagnostic/new` - Nouveau diagnostic
- `/school/:schoolId/teacher/diagnostic/:id` - Session diagnostic
- `/school/:schoolId/teacher/diagnostic/:id/results` - Résultats
- `/school/:schoolId/messages` - Messagerie
- `/activity/editor` - Créer activité
- `/activity/:id` - Voir activité

---

### STUDENT (Étudiant)
**Objectif:** Consulter et participer

**Peut:**
- ✅ Voir son profil
- ✅ Voir les activités de son école
- ✅ Participer aux diagnostics (?)
- ❌ NE PEUT PAS modifier de données
- ❌ NE PEUT PAS accéder aux autres écoles

**Pages:**
- `/school/:schoolId/student/dashboard` - Tableau de bord étudiant
- `/activity/:id` - Voir activité

**Statut:** 🚧 En développement (authentification manquante)

---

## 🔄 FLOWS MÉTIER IMPORTANTS

### 1. Création d'un Enseignant
```
Admin École
  ↓ POST /api/teachers
  ↓ Body: {email, fullName, schoolId, matiere}
  ↓
Backend
  ↓ Crée Profile
  ↓ Hash password auto-généré
  ↓ Crée UserRole (TEACHER)
  ↓ Envoie email avec credentials (TODO)
  ↓
Frontend
  ↓ Affiche credentials temporaires
  ↓ Admin les communique manuellement
```

### 2. Session d'Enseignement
```
Enseignant
  ↓ Choisit classe + activité
  ↓ Démarre session
  ↓ Marque présences
  ↓
Backend
  ↓ Crée TeachingSession
  ↓ Enregistre date, durée, participants
  ↓
Frontend
  ↓ Historique consultable
```

### 3. Upload de Fichier (Activité)
```
User
  ↓ Sélectionne fichier (image/pdf/video)
  ↓ POST /api/activity-files/upload
  ↓
Backend
  ↓ Valide type/taille
  ↓ Upload vers MinIO
  ↓ Génère signed URL (7 jours TTL)
  ↓ Sauvegarde metadata en DB
  ↓
Frontend
  ↓ Affiche preview
  ↓ Stocke file_id dans activity layout
```

### 4. Diagnostic Étudiant
```
Enseignant
  ↓ Crée session diagnostic
  ↓ Choisit élèves + matière
  ↓ Enregistre résultats individuels
  ↓
Backend
  ↓ Crée DiagnosticSession
  ↓ Associe résultats par élève
  ↓
Frontend
  ↓ Graphiques de progression
  ↓ Comparaison classe/école
```

---

## ⚠️ PROBLÈMES IDENTIFIÉS (Audit RBAC)

### Problèmes Critiques Résolus
1. ✅ Enum roles DB (admin, teacher) vs Java (SUPERADMIN, ADMIN, TEACHER, STUDENT)
2. ✅ Manque password_hash dans profiles
3. ✅ Pas de user_id dans students
4. ✅ Role casing (lowercase DB vs UPPERCASE Java)
5. ✅ JWT re-parsé à chaque vérification

### Problèmes Frontend Résolus
1. ✅ SchoolLogin redirection incorrecte (admin → teacher)
2. ✅ URLs dashboard incorrectes (/admin/X vs /school/X/admin/Y)
3. ✅ Login.tsx ne gérait pas UPPERCASE roles

### Problèmes Restants (À Corriger)
1. ⏳ **Issue #3:** Validation schoolId manquante dans dashboards
2. ⏳ **Issue #5:** AdminDashboard ne vérifie pas le rôle
3. ⏳ **Issue #6:** Pas d'interceptor pour token expiré
4. ⏳ **Issue #9:** Pas de toast quand accès refusé
5. ⏳ **Issue #10:** Pas de fonction utilitaire normalisation roles
6. ⏳ **Issue #12:** Pas de loading states

---

## 📁 STRUCTURE DES ROUTES (Frontend)

### Pattern de Routing

#### Public
```
/ → LandingPage
/schools → Liste écoles
/login → Login général
/signup → Inscription admin
/school/:id/login → Login spécifique école
```

#### Protected - SuperAdmin
```
/superadmin/dashboard
/superadmin/schools/:schoolId
/superadmin/activities/new
/superadmin/activities/edit/:activityId
```

#### Protected - Admin
```
/school/:id/admin/dashboard
/school/:id/admin/classes
/school/:id/admin/teachers
/school/:id/admin/activity-tracking
```

#### Protected - Teacher
```
/school/:id/teacher/dashboard
/school/:id/teacher/sessions
/school/:id/teacher/diagnostic/new
/school/:id/teacher/diagnostic/:sessionId
/school/:id/teacher/diagnostic/:sessionId/results
```

#### Protected - Student
```
/school/:id/student/dashboard (TODO)
```

#### Protected - Multi-roles
```
/school/:id/students → ADMIN, TEACHER
/school/:id/messages → Authenticated
/activity/editor → Authenticated
/activity/:id → Authenticated
```

---

## 🔧 COMPOSANTS CLÉS

### Backend

#### JwtAuthenticationFilter
- Intercepte toutes les requêtes
- Extrait et valide JWT
- Crée Authentication avec UserAuthenticationDetails
- Stocke dans SecurityContext

#### OwnershipValidationService
- Valide accès cross-school
- Empêche ADMIN/TEACHER d'accéder à autres écoles
- SUPERADMIN bypass toutes validations

#### ActivityFileService
- Upload vers MinIO
- Génère signed URLs
- Gère lifecycle (TTL 7 jours)
- Metadata en PostgreSQL

### Frontend

#### PrivateRoute
- Wrapper pour routes protégées
- Vérifie authentication
- Vérifie role requis
- Redirige si non autorisé

#### AuthContext
- Gère état authentification
- Fonction hasRole()
- Auto-refresh token (TODO)
- Logout global

#### API Client (lib/api.ts)
- Axios configuré
- Headers Authorization automatiques
- Gestion erreurs centralisée
- Base URL depuis env

---

## 🎯 PROCHAINES ÉTAPES

### Phase 1: Corrections High Priority
1. **Issue #3** - Validation schoolId dans dashboards
2. **Issue #6** - Interceptor axios pour token expiré
3. **Issue #9** - Toast feedback dans PrivateRoute

### Phase 2: Corrections Medium Priority
4. **Issue #5** - Validation rôle dans AdminDashboard
5. **Issue #10** - Utilitaire normalisation roles

### Phase 3: Améliorations
6. **Issue #12** - Loading states
7. Tests d'intégration RBAC
8. Documentation API complète

---

**Préparé par:** GitHub Copilot  
**Pour:** Corrections RBAC Frontend  
**Date:** 29 Octobre 2025
