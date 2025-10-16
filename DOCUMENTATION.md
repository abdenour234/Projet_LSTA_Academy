# Documentation Technique - Plateforme de Gestion Pédagogique

## 📋 Vue d'ensemble

Cette plateforme est une application web destinée à la gestion pédagogique des établissements scolaires marocains. Elle permet aux administrateurs et enseignants de réaliser des diagnostics pédagogiques standardisés, gérer des activités d'apprentissage personnalisées, et suivre la progression pédagogique.

## 🏗️ Architecture Technique

### Stack Technologique

**Frontend:**
- **React 18.3.1** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool et dev server
- **React Router DOM 6.30.1** - Gestion du routing
- **TanStack Query 5.83.0** - Gestion du state serveur et cache
- **Tailwind CSS** - Styling
- **shadcn/ui** - Composants UI (Radix UI)

**Backend:**
- **Lovable Cloud** (Supabase) - Backend complet
  - PostgreSQL - Base de données
  - Auth - Authentification
  - Storage - Stockage de fichiers
  - Row Level Security (RLS) - Sécurité des données

### Structure du Projet

```
src/
├── components/           # Composants réutilisables
│   ├── ui/              # Composants UI de base (shadcn)
│   ├── activity/        # Composants liés aux activités
│   │   ├── AutoActivityViewer.tsx  # Affichage automatique
│   ├── diagnostic/      # Composants de diagnostic
│   ├── admin/           # Composants admin
│   │   ├── AdminStatsCards.tsx     # Dashboard statistiques
│   ├── Header.tsx
│   ├── SchoolCard.tsx
│   └── ...
├── pages/               # Pages de l'application
│   ├── Index.tsx                    # Page d'accueil (liste écoles)
│   ├── SchoolLogin.tsx              # Page de connexion
│   ├── AdminDashboard.tsx           # Dashboard administrateur (avec stats)
│   ├── TeacherDashboard.tsx         # Dashboard enseignant
│   ├── ClassManagement.tsx          # Gestion des classes
│   ├── TeacherManagement.tsx        # Gestion des enseignants (avec auto-génération)
│   ├── TeacherSessions.tsx          # Enregistrement simplifié séances
│   ├── ActivityEditor.tsx           # Éditeur d'activités
│   ├── ActivityView.tsx             # Vue activité (avec auto-layout)
│   ├── ActivityTracking.tsx         # Suivi d'activité
│   ├── MessagingPage.tsx            # Messagerie interne
│   ├── DiagnosticNewSession.tsx     # Création session diagnostic
│   ├── DiagnosticSession.tsx        # Grille de diagnostic
│   └── DiagnosticSessionResults.tsx # Résultats diagnostic
├── types/               # Définitions TypeScript
│   ├── activity.ts
│   └── diagnostic.ts
├── config/              # Configuration
│   └── diagnosticGrids.ts # Grilles de diagnostic officielles
├── lib/                 # Utilitaires
│   ├── utils.ts
│   ├── createDemoUsers.ts
│   └── uploadToStorage.ts
├── integrations/        # Intégrations externes
│   └── supabase/
│       ├── client.ts    # Client Supabase (auto-généré)
│       └── types.ts     # Types DB (auto-généré)
├── hooks/               # Custom hooks
└── App.tsx              # Point d'entrée
```

## 🆕 Nouvelles Fonctionnalités

### Feature 1: Gestion Avancée des Enseignants

**Génération automatique d'identifiants:**
- Email institutionnel : `prenom.nom@[school_id].ma`
- Mot de passe aléatoire sécurisé (10 caractères)
- Affichage unique des credentials après création
- Boutons de copie rapide

**Workflow:**
1. Admin clique sur "Ajouter un enseignant"
2. Remplit: Nom complet, Matière, Téléphone
3. Système génère automatiquement email + mot de passe
4. Création du compte via Supabase Auth
5. Affichage des identifiants à transmettre

**Fichier:** `src/pages/TeacherManagement.tsx`

### Feature 2: Enregistrement Simplifié des Séances

**Interface optimisée:**
- Auto-détection de la date
- Checkboxes visuelles pour sélectionner les activités
- Jauge de progression interactive
- Validation en un clic
- Design moderne et intuitif

**Améliorations UX:**
- Activités affichées en grille cliquable
- Badges colorés par type (Orale, Lecture, Écriture)
- Compteur d'activités sélectionnées
- Bouton de validation désactivé si aucune activité

**Fichier:** `src/pages/TeacherSessions.tsx`

### Feature 3: Affichage Automatique des Activités

**Détection automatique du contenu:**
- PDF seul → Lecteur pleine page
- Vidéo seule → Player centré responsive
- Images seules → Grille d'images
- Contenu mixte → Layout automatique en sections

**Avantages:**
- Plus besoin de positionnement manuel
- Présentation optimale selon le type
- Design uniforme et professionnel
- Support du mode plein écran

**Fichiers:**
- `src/components/activity/AutoActivityViewer.tsx` (nouveau)
- `src/pages/ActivityView.tsx` (mis à jour)

### Feature 4: Dashboard Statistiques Admin

**Métriques affichées:**
- Classes actives
- Nombre d'enseignants
- Activités créées
- Séances réalisées
- Progression moyenne
- Utilisateurs actifs (7 jours)

**Visualisation:**
- Cards animées avec icônes colorées
- Chargement dynamique des données
- Mise à jour en temps réel

**Fichier:** `src/components/admin/AdminStatsCards.tsx`

## 🗄️ Modèle de Données

[... keep existing code ...]

### Tables Principales

#### 1. `schools` - Établissements scolaires
```sql
- id (text, PK)              # Identifiant unique
- name (text)                # Nom de l'école
- address (text)             # Adresse
- city (text)                # Ville
- region (text)              # Région
- level (text)               # Niveau (Primaire, Collège)
- status (text)              # Statut (Public, Privé)
- logo_url (text, nullable)  # URL du logo
- students (integer)         # Nombre d'élèves
- last_diagnostic (timestamp, nullable)
- created_at (timestamp)
```

#### 2. `profiles` - Profils utilisateurs (MODIFIÉ)
```sql
- id (uuid, PK, FK -> auth.users)
- email (text)
- full_name (text, nullable)
- school_id (text)
- matiere (text, nullable)    # NOUVEAU: Matière enseignée
- phone (text, nullable)      # NOUVEAU: Téléphone
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. `classes` - Classes (NOUVEAU)
```sql
- id (uuid, PK)
- name (text)
- level (text)
- school_id (text)
- effectif (integer)
- filiere (text, nullable)
- annee_scolaire (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 4. `teacher_classes` - Affectations enseignants (NOUVEAU)
```sql
- id (uuid, PK)
- teacher_id (uuid, FK -> auth.users)
- class_id (uuid, FK -> classes)
- created_at (timestamp)
```

#### 5. `teaching_sessions` - Séances d'enseignement (NOUVEAU)
```sql
- id (uuid, PK)
- teacher_id (uuid, FK -> auth.users)
- school_id (text)
- class_id (uuid, FK -> classes)
- session_date (date)
- duration_minutes (integer)
- activities_realized (text[])     # Liste des activités
- percentage_acquired (integer)    # Pourcentage d'acquisition
- remarks (text, nullable)         # Remarques pédagogiques
- created_at (timestamp)
- updated_at (timestamp)
```

**RLS Policies:**
- Insert: enseignant peut créer pour son école
- Update: enseignant peut modifier ses sessions
- Select: utilisateurs de l'école

#### 6. `session_progress` - Progression par compétence (NOUVEAU)
```sql
- id (uuid, PK)
- session_id (uuid, FK -> teaching_sessions)
- competence (text)
- acquired_count (integer)
- not_acquired_count (integer)
- created_at (timestamp)
```

#### 7. `user_activity_logs` - Suivi d'activité (NOUVEAU)
```sql
- id (uuid, PK)
- user_id (uuid, FK -> auth.users)
- school_id (text)
- activity_type (text)
- activity_date (date)
- duration_seconds (integer)
- metadata (jsonb)
- created_at (timestamp)
```

**RLS Policies:**
- Insert: utilisateur peut créer ses logs
- Select: utilisateur voit ses logs, admin voit tous les logs de l'école

#### 8. `conversations` - Conversations messagerie (NOUVEAU)
```sql
- id (uuid, PK)
- school_id (text)
- participant_ids (uuid[])
- subject (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 9. `messages` - Messages (NOUVEAU)
```sql
- id (uuid, PK)
- conversation_id (uuid, FK -> conversations)
- sender_id (uuid, FK -> auth.users)
- content (text)
- attachments (jsonb, nullable)
- read_by (uuid[])
- created_at (timestamp)
```

[... keep existing diagnostic tables ...]

## 🔐 Système d'Authentification

### Création Automatique d'Enseignants

**Format email généré:**
```
prenom.nom@[school_id].ma
```

**Algorithme de génération:**
1. Normaliser le nom (enlever accents)
2. Remplacer espaces par points
3. Convertir en minuscules
4. Ajouter domaine école

**Mot de passe:**
- 10 caractères aléatoires
- Combinaison lettres et chiffres
- Exclu caractères ambigus (0, O, I, l)

**Code exemple:**
```typescript
const generateEmail = (fullName: string, schoolId: string) => {
  const namePart = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".");
  return `${namePart}@${schoolId}.ma`;
};

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
```

## 📊 Système de Suivi d'Activité

### Tracking Automatique

**Actions trackées:**
- Connexion/Déconnexion
- Création d'activité
- Enregistrement de séance
- Consultation de diagnostic
- Utilisation de la messagerie

**Métriques calculées:**
- Temps total d'utilisation
- Temps moyen par session
- Nombre d'activités par jour
- Score d'engagement (0-100)

**Fichier:** `src/pages/ActivityTracking.tsx`

## 💬 Système de Messagerie

### Fonctionnalités

**Messagerie interne:**
- Conversations entre admin ↔ enseignants
- Liste de contacts (emails institutionnels visibles)
- Envoi de messages et pièces jointes
- Notification de nouveaux messages
- Historique des échanges

**Fichier:** `src/pages/MessagingPage.tsx`

## 🎯 Système d'Activités Amélioré

### Auto-Layout Intelligent

**Détection automatique:**
```typescript
// Si uniquement PDF
if (hasOnlyPDF) {
  return <PDFViewer fullPage />;
}

// Si uniquement vidéo
if (hasOnlyVideo) {
  return <VideoViewer centered />;
}

// Si uniquement images
if (hasOnlyImages) {
  return <ImageGrid />;
}

// Contenu mixte
return <AutoGridLayout elements={elements} />;
```

**Avantages:**
- Fini le positionnement manuel
- Présentation optimale automatique
- Design cohérent
- Support responsive

## 🚀 Déploiement et Configuration

[... keep existing deployment section ...]

## 🛠️ Guide de Développement

### Ajouter une Statistique au Dashboard

**Étape 1:** Modifier `AdminStatsCards.tsx`
```typescript
// Ajouter la requête dans loadStats()
const { count: newMetric } = await supabase
  .from('table_name' as any)
  .select('*', { count: 'exact', head: true });

// Ajouter au state
setStats({
  ...stats,
  newMetric: count || 0,
});

// Ajouter la card
statCards.push({
  title: 'Nouvelle Métrique',
  value: stats.newMetric,
  icon: Icon,
  color: 'text-primary',
  bg: 'bg-primary/10',
});
```

### Personnaliser l'Enregistrement de Séances

**Modifier le formulaire:**
`src/pages/TeacherSessions.tsx`

```typescript
// Ajouter un champ
<div>
  <Label htmlFor="new_field">Nouveau champ</Label>
  <Input
    id="new_field"
    value={formData.new_field}
    onChange={(e) =>
      setFormData({ ...formData, new_field: e.target.value })
    }
  />
</div>
```

**Attention:** Ajouter le champ dans la table `teaching_sessions` via migration

### Ajouter un Type d'Activité

**Étape 1:** Ajouter dans `ActivityBuilder.tsx`
```typescript
const activityTypes = [
  { value: "Orale", color: "orale" },
  { value: "Lecture", color: "lecture" },
  { value: "Écriture", color: "ecriture" },
  { value: "NouveauType", color: "nouveau" }, // Nouveau
];
```

**Étape 2:** Ajouter la couleur dans `index.css`
```css
:root {
  --nouveau: 220 70% 50%;
}
```

## 🐛 Debugging et Problèmes Courants

### Problème: Types Supabase non à jour après migration

**Symptôme:** Erreurs TypeScript `type 'never'`

**Solution:**
1. Ouvrir le Backend dans l'interface Lovable
2. Les types se régénèrent automatiquement
3. Rafraîchir la page

⚠️ **Ne jamais modifier** `src/integrations/supabase/types.ts` manuellement

### Problème: Email déjà existant lors création enseignant

**Symptôme:** Erreur "User already registered"

**Solution:**
- Vérifier que l'enseignant n'existe pas déjà
- Utiliser un format de nom différent si doublon
- Ajouter un numéro si nécessaire (ex: `prenom.nom.2@school.ma`)

### Problème: Activities non affichées correctement

**Symptôme:** Layout cassé ou vide

**Solution:**
1. Vérifier que `layout_data.elements` existe
2. Vérifier les URLs des fichiers (Storage)
3. Regarder la console pour erreurs de chargement
4. Vérifier les permissions Storage (RLS)

## 📚 Ressources et Liens

[... keep existing resources ...]

### Routes Mises à Jour

```
/                                          # Liste des écoles
/school/:id/login                          # Login école
/school/:id/admin/dashboard                # Dashboard admin (avec stats)
/school/:id/admin/classes                  # Gestion des classes
/school/:id/admin/teachers                 # Gestion des enseignants
/school/:id/admin/activity-tracking        # Suivi d'activité
/school/:id/teacher/dashboard              # Dashboard enseignant
/school/:id/teacher/sessions               # Enregistrement séances
/school/:id/teacher/diagnostic/new         # Nouvelle session diagnostic
/school/:id/teacher/diagnostic/:sessionId  # Grille de diagnostic
/school/:id/teacher/diagnostic/:sessionId/results  # Résultats
/school/:id/messages                       # Messagerie
/activity/editor                           # Créer activité
/activity/editor/:activityId               # Éditer activité
/activity/:activityId                      # Voir activité (auto-layout)
```

## 🎯 Roadmap Futures Améliorations

### Fonctionnalités Développées ✅

1. **Gestion avancée des enseignants** ✅
   - Génération automatique d'identifiants
   - Affectation de classes
   - Suivi d'activité

2. **Enregistrement simplifié de séances** ✅
   - Interface moderne avec checkboxes
   - Auto-détection de la date
   - Validation rapide

3. **Affichage automatique d'activités** ✅
   - Détection du type de contenu
   - Layout automatique optimisé
   - Support multi-formats

4. **Dashboard statistiques** ✅
   - 6 métriques clés
   - Visualisation temps réel
   - Design moderne

5. **Messagerie interne** ✅
   - Communication admin ↔ enseignants
   - Emails institutionnels visibles
   - Historique des échanges

### À Développer

1. **Export PDF des résultats** (diagnostics + séances)
2. **Graphiques avancés** (courbes de progression)
3. **Notifications push** (nouveaux messages, activités)
4. **Mode hors-ligne** (PWA)
5. **Partage d'activités** (inter-écoles)
6. **Bibliothèque de templates** (activités pré-conçues)
7. **Historique pédagogique** (tout le travail d'un enseignant)
8. **Analyse prédictive** (AI pour recommandations)
9. **Multi-langue** (Français, Arabe, Amazigh)
10. **Rapports automatiques** (hebdomadaires, mensuels)

## 📝 Conventions de Code

[... keep existing conventions ...]

## 🔧 Maintenance

### Mise à Jour après Migration

**Workflow:**
1. Écrire la migration SQL
2. L'utilisateur approuve
3. Migration exécutée automatiquement
4. **Ouvrir le Backend pour régénérer les types**
5. Vérifier que tout compile
6. Tester les fonctionnalités modifiées

### Backup et Sécurité

- Snapshots automatiques quotidiens (Supabase)
- RLS activé sur toutes les tables
- Validation côté serveur ET client
- Logs d'audit (user_activity_logs)

---

## 📞 Support

Pour toute question ou problème:

1. Consulter cette documentation
2. Vérifier les logs Backend
3. Consulter la documentation officielle
4. Créer une issue sur le repo Git

---

**Version:** 2.0.0  
**Dernière mise à jour:** 2025-10-16  
**Auteur:** Équipe de développement
**Changelog:**
- v2.0.0: Ajout gestion enseignants, séances simplifiées, auto-layout activités, stats dashboard, messagerie
- v1.0.0: Version initiale avec diagnostics et activités de base
