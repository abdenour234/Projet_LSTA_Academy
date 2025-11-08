# 🔍 Audit Frontend - Problèmes de Redirection et Navigation

**Date:** 29 Octobre 2025  
**Branch:** `rbac-audit-and-fixes`  
**Statut:** 🔴 **PROBLÈMES CRITIQUES IDENTIFIÉS**

---

## 📋 Résumé Exécutif

L'audit a identifié **12 problèmes critiques** dans le frontend qui causent des redirections incorrectes et des incohérences de navigation :

1. **Casse des rôles incohérente** entre pages
2. **Logique de redirection différente** selon la page de login
3. **Vérifications de rôle manquantes**
4. **URLs de redirection incorrectes**
5. **Navigation basée sur des suppositions erronées**

---

## 🚨 Problèmes Critiques Identifiés

### **PROBLÈME #1: Incohérence de Casse des Rôles** 🔴 CRITIQUE

**Description:**
Les pages de login utilisent des casses différentes pour vérifier les rôles, causant des redirections incorrectes.

**Fichiers Affectés:**

1. **Login.tsx** (Ligne 40)
```tsx
const role = response.user.role?.toUpperCase() || '';
switch (role) {
  case 'SUPERADMIN': navigate('/superadmin/dashboard'); break;
  case 'ADMIN': navigate(`/school/${schoolId}/admin/dashboard`); break;
  case 'TEACHER': navigate(`/school/${schoolId}/teacher/dashboard`); break;
  case 'STUDENT': navigate('/student/dashboard'); break;
}
```
✅ **Correct** - Utilise UPPERCASE

2. **SchoolLogin.tsx** (Ligne 56)
```tsx
const role = user.role?.toLowerCase();
if (role === 'admin' || role === 'school_admin') {
  navigate(`/school/${id}/admin/dashboard`);
} else {
  navigate(`/school/${id}/teacher/dashboard`);
}
```
❌ **Problème** - Utilise lowercase et suppose que tout ce qui n'est pas admin est teacher!

3. **SuperAdminLogin.tsx** (Ligne 27)
```tsx
if (user.role?.toLowerCase() !== 'superadmin') {
  // Refuse access
}
```
✅ **Correct** - Utilise lowercase avec conversion

**Impact:**
- Un ADMIN pourrait être redirigé vers la page TEACHER
- Un STUDENT pourrait être redirigé vers la page TEACHER
- Aucune validation du schoolId dans SchoolLogin

**Fix Requis:** ✅
Normaliser toutes les vérifications de rôle en UPPERCASE et gérer tous les cas.

---

### **PROBLÈME #2: SchoolLogin Ne Gère Pas STUDENT** 🔴 CRITIQUE

**Location:** `frontend/src/pages/SchoolLogin.tsx:56`

```tsx
const role = user.role?.toLowerCase();
if (role === 'admin' || role === 'school_admin') {
  navigate(`/school/${id}/admin/dashboard`);
} else {
  navigate(`/school/${id}/teacher/dashboard`); // ❌ ERREUR!
}
```

**Problème:**
- Un STUDENT se connectant via SchoolLogin sera redirigé vers `/school/${id}/teacher/dashboard`
- Aucune vérification du rôle STUDENT
- Le else suppose que c'est un TEACHER

**Impact:**
Les étudiants ne peuvent pas se connecter correctement via la page école.

**Fix Requis:** ✅
```tsx
const role = user.role?.toUpperCase();
switch (role) {
  case 'ADMIN':
    navigate(`/school/${id}/admin/dashboard`);
    break;
  case 'TEACHER':
    navigate(`/school/${id}/teacher/dashboard`);
    break;
  case 'STUDENT':
    navigate('/student/dashboard'); // ou `/school/${id}/student/dashboard`
    break;
  default:
    // Gérer le cas d'erreur
}
```

---

### **PROBLÈME #3: Vérification school_admin Obsolète** ⚠️ MEDIUM

**Location:** `frontend/src/pages/SchoolLogin.tsx:56`

```tsx
if (role === 'admin' || role === 'school_admin') {
```

**Problème:**
- Le backend n'a que 4 rôles: SUPERADMIN, ADMIN, TEACHER, STUDENT
- `school_admin` n'existe pas
- Cette vérification est inutile et peut causer de la confusion

**Impact:**
Code mort qui suggère l'existence d'un rôle inexistant.

**Fix Requis:** ✅
Supprimer la vérification `school_admin`.

---

### **PROBLÈME #4: URLs de Redirection Admin Incorrectes** 🔴 CRITIQUE

**Locations:**
- `frontend/src/pages/ClassManagement.tsx:356`
- `frontend/src/pages/TeacherManagement.tsx:232`
- `frontend/src/pages/StudentManagement.tsx:207`

```tsx
onClick={() => navigate(`/admin/${schoolId}/dashboard`)}
```

**Problème:**
L'URL correcte dans App.tsx est `/school/${schoolId}/admin/dashboard` et NON `/admin/${schoolId}/dashboard`.

**Impact:**
Les boutons "Retour au Dashboard" dans les pages de gestion mènent à une 404.

**Fix Requis:** ✅
```tsx
onClick={() => navigate(`/school/${schoolId}/admin/dashboard`)}
```

---

### **PROBLÈME #5: Redirection TeacherSessions Incorrecte** ⚠️ MEDIUM

**Location:** `frontend/src/pages/TeacherSessions.tsx:181`

```tsx
onClick={() => navigate(`/school/${schoolId}/teacher`)}
```

**Problème:**
L'URL `/school/${schoolId}/teacher` n'existe pas. Devrait être `/school/${schoolId}/teacher/dashboard`.

**Impact:**
Le bouton retour mène à une 404.

**Fix Requis:** ✅
```tsx
onClick={() => navigate(`/school/${schoolId}/teacher/dashboard`)}
```

---

### **PROBLÈME #6: Pas de Validation de schoolId** 🔴 CRITIQUE

**Location:** Multiple pages (AdminDashboard, TeacherDashboard, etc.)

**Problème:**
Les pages dashboard utilisent le paramètre `schoolId` de l'URL sans vérifier qu'il correspond au `schoolId` de l'utilisateur connecté.

**Exemple:**
```tsx
// AdminDashboard.tsx
const { id: schoolId } = useParams();
// ❌ Aucune vérification que user.schoolId === schoolId
```

**Impact:**
- Un admin de l'école A pourrait tenter d'accéder à `/school/B/admin/dashboard`
- Fuite de données potentielle
- Pas de protection côté frontend (backend devrait bloquer mais frontend devrait aussi vérifier)

**Fix Requis:** ✅
```tsx
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.schoolId !== schoolId && user.role !== 'SUPERADMIN') {
    navigate('/'); // Ou afficher erreur
  }
}, [schoolId, navigate]);
```

---

### **PROBLÈME #7: Page Login Universelle vs Pages Login Spécifiques** ⚠️ MEDIUM

**Problème:**
Il y a 3 pages de login différentes:
1. `/login` - Login.tsx (universel)
2. `/school/${id}/login` - SchoolLogin.tsx (spécifique école)
3. `/superadmin/login` - SuperAdminLogin.tsx (spécifique superadmin)

**Confusion:**
- Quelle page utiliser pour quel cas?
- Login.tsx redirige correctement mais nécessite que l'utilisateur connaisse son rôle
- SchoolLogin.tsx a une logique incorrecte
- SuperAdminLogin.tsx est correct mais séparé

**Impact:**
Expérience utilisateur fragmentée et incohérente.

**Recommandation:** 🔄
Décider d'une stratégie unifiée:
- **Option A:** Une seule page login qui détecte et redirige
- **Option B:** Garder les pages séparées mais corriger la logique

---

### **PROBLÈME #8: Pas de Redirection Après Déconnexion** ⚠️ LOW

**Location:** Divers composants

**Problème:**
Après déconnexion, pas de redirection systématique vers la page de login appropriée.

**Fix Requis:** ✅
Standardiser la déconnexion pour rediriger vers `/login` ou la page login de l'école.

---

### **PROBLÈME #9: Routes Non Protégées dans App.tsx** 🔴 CRITIQUE

**Location:** `frontend/src/App.tsx`

**Problème:**
Certaines routes nécessitent une authentification mais n'utilisent pas `PrivateRoute`.

**Exemple:**
```tsx
<Route path="/school/:id/messages" element={<PrivateRoute><MessagingPage /></PrivateRoute>} />
```
✅ Protégé

Mais:
```tsx
<Route path="/activity/:activityId" element={<PrivateRoute><ActivityView /></PrivateRoute>} />
```
✅ Protégé mais sans vérification de rôle spécifique

**Impact:**
Toutes les routes nécessitant auth sont protégées mais certaines n'ont pas de restriction de rôle.

**Recommandation:** 🔄
Vérifier que chaque route a les bonnes restrictions de rôle.

---

### **PROBLÈME #10: PrivateRoute Redirection Logic** ⚠️ MEDIUM

**Location:** `frontend/src/components/PrivateRoute.tsx:51`

```tsx
const userRole = user?.role.toUpperCase();
let unauthorizedRedirect = '/';

switch (userRole) {
  case 'SUPERADMIN':
    unauthorizedRedirect = '/superadmin/dashboard';
    break;
  case 'ADMIN':
    unauthorizedRedirect = user?.schoolId 
      ? `/school/${user.schoolId}/admin/dashboard` 
      : '/';
    break;
  // ...
}
```

**Problème:**
Cette logique suppose que si un utilisateur n'a pas le bon rôle, il doit être redirigé vers SA page dashboard. Mais cela pourrait masquer des erreurs.

**Exemple:**
- Un TEACHER tente d'accéder à `/superadmin/dashboard`
- Au lieu d'afficher "Accès refusé", il est silencieusement redirigé vers `/school/${schoolId}/teacher/dashboard`

**Impact:**
Pas de feedback utilisateur clair sur les tentatives d'accès non autorisé.

**Fix Requis:** ✅
Ajouter un toast d'erreur avant redirection.

---

### **PROBLÈME #11: AuthContext hasRole Case Sensitivity** ⚠️ LOW

**Location:** `frontend/src/contexts/AuthContext.tsx:114`

```tsx
const hasRole = (requiredRole: string | string[]): boolean => {
  if (!user) return false;
  
  const userRole = user.role.toUpperCase();
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => userRole === role.toUpperCase());
  }
  
  return userRole === requiredRole.toUpperCase();
};
```

**Problème:**
La conversion en UPPERCASE est faite côté AuthContext mais les composants passent parfois des rôles en lowercase, parfois en uppercase.

**Impact:**
Fragile et dépend de la conversion défensive.

**Fix Requis:** ✅
Documenter que les rôles doivent être passés en UPPERCASE OU normaliser toujours.

---

### **PROBLÈME #12: Pas de Gestion des Tokens Expirés** 🔴 CRITIQUE

**Location:** Frontend global

**Problème:**
Si le token JWT expire pendant la session:
- Aucune redirection automatique vers login
- Les requêtes échouent silencieusement
- Mauvaise expérience utilisateur

**Fix Requis:** ✅
Implémenter un intercepteur axios pour:
1. Détecter les 401 Unauthorized
2. Déconnecter l'utilisateur
3. Rediriger vers la page de login appropriée
4. Afficher un message clair

---

## 📊 Tableau Récapitulatif

| # | Problème | Sévérité | Fichiers Affectés | Impact |
|---|----------|----------|-------------------|---------|
| 1 | Incohérence casse rôles | 🔴 CRITIQUE | Login.tsx, SchoolLogin.tsx | Redirections incorrectes |
| 2 | SchoolLogin sans STUDENT | 🔴 CRITIQUE | SchoolLogin.tsx | Students mal redirigés |
| 3 | school_admin obsolète | ⚠️ MEDIUM | SchoolLogin.tsx | Code mort |
| 4 | URLs admin incorrectes | 🔴 CRITIQUE | 3 fichiers | 404 sur boutons retour |
| 5 | URL TeacherSessions | ⚠️ MEDIUM | TeacherSessions.tsx | 404 sur retour |
| 6 | Pas de validation schoolId | 🔴 CRITIQUE | Tous dashboards | Fuite données potentielle |
| 7 | Pages login multiples | ⚠️ MEDIUM | 3 fichiers | Confusion UX |
| 8 | Redirection logout | ⚠️ LOW | Global | UX incohérente |
| 9 | Routes non protégées | 🔴 CRITIQUE | App.tsx | Accès non autorisé |
| 10 | PrivateRoute silencieuse | ⚠️ MEDIUM | PrivateRoute.tsx | Pas de feedback |
| 11 | hasRole case sensitivity | ⚠️ LOW | AuthContext.tsx | Code fragile |
| 12 | Tokens expirés | 🔴 CRITIQUE | Global | Mauvaise UX |

**Total:** 12 problèmes  
**Critiques:** 6 🔴  
**Medium:** 5 ⚠️  
**Low:** 1 ⚠️

---

## ✅ Corrections Prioritaires

### Phase 1: CRITIQUE (Immédiat)
1. ✅ **Fixer SchoolLogin.tsx** - Gérer tous les rôles correctement
2. ✅ **Corriger URLs admin** - /school/${id}/admin au lieu de /admin/${id}
3. ✅ **Ajouter validation schoolId** - Vérifier que user.schoolId correspond
4. ✅ **Intercepteur tokens expirés** - Auto-déconnexion et redirection
5. ✅ **Vérifier toutes les routes protégées** - Restrictions de rôle correctes

### Phase 2: MEDIUM (Haute priorité)
1. ✅ **Normaliser casse des rôles** - UPPERCASE partout
2. ✅ **Corriger URL TeacherSessions** - Ajouter /dashboard
3. ✅ **Supprimer school_admin** - Nettoyer code obsolète
4. ✅ **Améliorer PrivateRoute** - Ajouter toast sur accès refusé

### Phase 3: LOW (Améliorations)
1. 🔄 **Unifier stratégie login** - Décider une seule approche
2. 🔄 **Documenter hasRole** - Clarifier usage UPPERCASE

---

## 🔧 Exemples de Corrections

### Fix #1: SchoolLogin.tsx
```tsx
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await authApi.login(email, password);
    const user = response.user;

    // Verify the user belongs to this school
    if (user.schoolId !== id) {
      await authApi.logout();
      toast({
        title: 'Erreur',
        description: 'Vous n\'êtes pas autorisé à accéder à cette école.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Navigate based on role (UPPERCASE)
    const role = user.role?.toUpperCase();
    
    switch (role) {
      case 'ADMIN':
        navigate(`/school/${id}/admin/dashboard`);
        break;
      case 'TEACHER':
        navigate(`/school/${id}/teacher/dashboard`);
        break;
      case 'STUDENT':
        navigate('/student/dashboard');
        break;
      default:
        toast({
          title: 'Erreur',
          description: `Rôle non reconnu: ${user.role}`,
          variant: 'destructive',
        });
        await authApi.logout();
        return;
    }

    toast({
      title: 'Connexion réussie',
      description: `Bienvenue sur ${schoolName}`,
    });
  } catch (error) {
    // ... error handling
  }
};
```

### Fix #2: Validation schoolId dans Dashboard
```tsx
// AdminDashboard.tsx
useEffect(() => {
  const checkAccess = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate(`/school/${id}/login`);
      return;
    }

    const user = JSON.parse(userStr);
    
    // SUPERADMIN can access all schools
    if (user.role?.toUpperCase() === 'SUPERADMIN') {
      return;
    }

    // Other users must match schoolId
    if (user.schoolId !== id) {
      toast({
        title: 'Accès refusé',
        description: 'Vous ne pouvez pas accéder à cette école.',
        variant: 'destructive',
      });
      navigate(`/school/${user.schoolId}/admin/dashboard`);
      return;
    }
  };

  checkAccess();
}, [id, navigate]);
```

### Fix #3: Intercepteur Axios pour tokens expirés
```typescript
// frontend/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// Response interceptor pour gérer tokens expirés
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Rediriger vers login
      window.location.href = '/login';
      
      return Promise.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
    }
    return Promise.reject(error);
  }
);
```

---

## 📝 Prochaines Étapes

1. **Revoir ce rapport** avec l'équipe
2. **Prioriser les fixes** selon sévérité
3. **Créer des branches** pour chaque groupe de fixes
4. **Tester minutieusement** chaque correction
5. **Valider** avec scénarios utilisateur réels

---

**Audit réalisé par:** GitHub Copilot  
**Date:** 29 Octobre 2025  
**Branch:** `rbac-audit-and-fixes`
