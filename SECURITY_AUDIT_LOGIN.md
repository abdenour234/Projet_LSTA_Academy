# 🔐 AUDIT COMPLET DE SÉCURITÉ - SYSTÈME D'AUTHENTIFICATION

**Date:** 31 Octobre 2025  
**Branche:** rbac-audit-and-fixes  
**Priorité:** CRITIQUE 🔴

---

## 📋 PROBLÈMES IDENTIFIÉS

### 🔴 CRITIQUE - Problème #1: Redirection Incorrecte Basée sur le Rôle

**Symptôme:** Admin connecté → redirigé vers SuperAdmin dashboard (et vice-versa)

**Cause Racine:**
1. Login.tsx utilise `normalizeRole()` et `getRoleDashboardRoute()` mais ne valide PAS le rôle retourné par le backend
2. Backend retourne le rôle en UPPERCASE (`ADMIN`, `SUPERADMIN`) mais le frontend ne vérifie pas si c'est cohérent
3. Pas de validation du schoolId pour les rôles qui en ont besoin (ADMIN, TEACHER)

**Fichiers Affectés:**
- `frontend/src/pages/Login.tsx`
- `frontend/src/lib/roleUtils.ts`
- `frontend/src/contexts/AuthContext.tsx`

---

### 🔴 CRITIQUE - Problème #2: Absence de Validation Côté Client Après Login

**Symptôme:** User peut accéder à des pages non autorisées en manipulant l'URL

**Cause Racine:**
1. PrivateRoute vérifie le rôle mais **APRÈS** que la page soit chargée
2. Pas de vérification immédiate du schoolId dans les routes qui nécessitent un contexte école
3. LocalStorage peut être manipulé directement par l'utilisateur

**Fichiers Affectés:**
- `frontend/src/components/PrivateRoute.tsx`
- `frontend/src/App.tsx` (routes)

---

### 🟡 IMPORTANT - Problème #3: Incohérence dans la Gestion des Rôles

**Symptôme:** Parfois le rôle est en minuscule, parfois en majuscule

**Cause Racine:**
1. Backend retourne `role.name()` (UPPERCASE)
2. Frontend stocke tel quel dans localStorage
3. Certaines comparaisons utilisent `.toUpperCase()`, d'autres non
4. `normalizeRole()` n'est pas utilisé partout

**Fichiers Affectés:**
- Tous les dashboards
- Toutes les pages avec validation de rôle
- PrivateRoute.tsx
- AuthContext.tsx

---

### 🟡 IMPORTANT - Problème #4: Token JWT Non Validé Avant Redirection

**Symptôme:** Même avec un token expiré, l'utilisateur peut être redirigé brièvement

**Cause Racine:**
1. Login.tsx redirige **immédiatement** après avoir reçu la réponse
2. Pas de vérification que le token est valide
3. AuthContext.checkAuth() est asynchrone mais pas attendu avant redirection

**Fichiers Affectés:**
- `frontend/src/pages/Login.tsx`
- `frontend/src/contexts/AuthContext.tsx`

---

### 🟢 MINEUR - Problème #5: Messages d'Erreur Trop Génériques

**Symptôme:** Utilisateur ne sait pas pourquoi la connexion échoue

**Cause Racine:**
1. Toast toujours "Email ou mot de passe incorrect"
2. Pas de distinction entre compte inexistant, mot de passe incorrect, compte désactivé, etc.

**Fichiers Affectés:**
- `frontend/src/pages/Login.tsx`

---

## 🛠️ CORRECTIONS REQUISES

### Correction #1: Renforcer Login.tsx

**Objectif:** Valider complètement le rôle et le schoolId avant redirection

```typescript
// Après await authApi.login()
const response = await authApi.login(formData.email, formData.password);

// ✅ NOUVELLE VALIDATION COMPLÈTE
const userRole = normalizeRole(response.user.role);
if (!userRole) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  toast({
    title: 'Erreur de configuration',
    description: 'Rôle utilisateur invalide. Contactez un administrateur.',
    variant: 'destructive',
  });
  return;
}

// ✅ Vérifier que les rôles qui nécessitent schoolId en ont un
if ((userRole === 'ADMIN' || userRole === 'TEACHER') && !response.user.schoolId) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  toast({
    title: 'Erreur de configuration',
    description: 'Aucune école associée. Contactez un administrateur.',
    variant: 'destructive',
  });
  return;
}

// ✅ Stocker avec rôle normalisé
const normalizedUser = {
  ...response.user,
  role: userRole, // TOUJOURS EN UPPERCASE
};
localStorage.setItem('user', JSON.stringify(normalizedUser));

// ✅ Vérifier le token avant redirection
try {
  await authApi.getCurrentUser(); // Force une validation du token
} catch (error) {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  toast({
    title: 'Erreur d'authentification',
    description: 'Token invalide. Réessayez.',
    variant: 'destructive',
  });
  return;
}

// ✅ Maintenant on peut rediriger en toute sécurité
const dashboardRoute = getRoleDashboardRoute(userRole, response.user.schoolId);
navigate(dashboardRoute, { replace: true });
```

---

### Correction #2: Renforcer PrivateRoute

**Objectif:** Bloquer l'accès IMMÉDIATEMENT avant le rendu, pas après

```typescript
// Ajouter validation stricte du schoolId pour les routes école
const location = useLocation();
const requiresSchoolContext = location.pathname.includes('/school/');

if (requiresSchoolContext && !user?.schoolId) {
  toast({
    title: 'Accès refusé',
    description: 'Cette page nécessite un contexte école.',
    variant: 'destructive',
  });
  return <Navigate to="/" replace />;
}

// Vérifier que le schoolId de l'URL correspond au schoolId de l'utilisateur
if (requiresSchoolContext) {
  const urlSchoolId = location.pathname.split('/school/')[1]?.split('/')[0];
  if (urlSchoolId && user?.schoolId && urlSchoolId !== user.schoolId) {
    toast({
      title: 'Accès refusé',
      description: 'Vous ne pouvez pas accéder à cette école.',
      variant: 'destructive',
    });
    return <Navigate to={getRoleDashboardRoute(user.role, user.schoolId)} replace />;
  }
}
```

---

### Correction #3: Normaliser TOUS les Rôles au Chargement

**Objectif:** Garantir que le rôle est TOUJOURS en UPPERCASE partout

**Dans AuthContext.tsx:**
```typescript
const checkAuth = async (): Promise<void> => {
  try {
    if (!auth.isAuthenticated()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const currentUser = await authApi.getCurrentUser();
    
    // ✅ NORMALISER LE RÔLE IMMÉDIATEMENT
    const normalizedUser = {
      ...currentUser,
      role: normalizeRole(currentUser.role) || currentUser.role.toUpperCase(),
    };
    
    setUser(normalizedUser);
    
    // ✅ Mettre à jour localStorage avec le rôle normalisé
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    
  } catch (error) {
    console.error('Auth check failed:', error);
    auth.removeToken();
    setUser(null);
  } finally {
    setLoading(false);
  }
};
```

---

### Correction #4: Ajouter Route Guards Stricts

**Objectif:** Chaque dashboard doit vérifier son propre accès en plus de PrivateRoute

**Pattern à ajouter dans TOUS les dashboards:**

```typescript
useEffect(() => {
  const validateAccess = () => {
    const user = auth.getUser();
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const userRole = normalizeRole(user.role);
    
    // Pour SuperAdminDashboard
    if (userRole !== 'SUPERADMIN') {
      toast({
        title: 'Accès refusé',
        description: 'Cette page est réservée aux super administrateurs.',
        variant: 'destructive',
      });
      navigate(getRoleDashboardRoute(userRole, user.schoolId), { replace: true });
      return;
    }
  };

  validateAccess();
}, [navigate, toast]);
```

---

### Correction #5: Sécuriser les API Calls

**Objectif:** Vérifier le rôle avant CHAQUE appel API critique

**Dans api.ts, ajouter:**

```typescript
// Helper pour vérifier si l'utilisateur a le bon rôle avant l'appel API
export const requireRole = (requiredRole: string | string[]): boolean => {
  const user = auth.getUser();
  if (!user) return false;
  
  const userRole = user.role.toUpperCase();
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => userRole === role.toUpperCase());
  }
  
  return userRole === requiredRole.toUpperCase();
};

// Exemple d'utilisation dans superAdminApi
getStats: async () => {
  if (!requireRole('SUPERADMIN')) {
    throw new ApiError(403, 'Accès refusé: Rôle SUPERADMIN requis');
  }
  return request<any>('/superadmin/stats');
},
```

---

## 🎯 CHECKLIST DE SÉCURITÉ

### Login & Authentification
- [ ] Login.tsx valide le rôle avec normalizeRole()
- [ ] Login.tsx vérifie schoolId pour ADMIN/TEACHER
- [ ] Login.tsx vérifie le token avant redirection
- [ ] Login.tsx stocke le rôle normalisé (UPPERCASE)
- [ ] Login.tsx utilise `replace: true` pour la navigation

### Routes Protection
- [ ] PrivateRoute vérifie schoolId pour routes /school/:id/*
- [ ] PrivateRoute compare schoolId URL vs user.schoolId
- [ ] PrivateRoute utilise normalizeRole() pour comparaisons
- [ ] App.tsx a requiredRole pour TOUTES les routes protégées
- [ ] Aucune route sensible n'est accessible sans PrivateRoute

### Dashboards
- [ ] SuperAdminDashboard vérifie role === 'SUPERADMIN'
- [ ] AdminDashboard vérifie role === 'ADMIN' && schoolId
- [ ] TeacherDashboard vérifie role === 'TEACHER' && schoolId
- [ ] StudentDashboard vérifie role === 'STUDENT'
- [ ] Tous les dashboards redirigent si validation échoue

### Context & State
- [ ] AuthContext normalise le rôle au chargement
- [ ] AuthContext met à jour localStorage avec rôle normalisé
- [ ] useAuth.hasRole() utilise normalizeRole()
- [ ] Aucune comparaison de rôle sans .toUpperCase()

### API Security
- [ ] api.ts a requireRole() helper
- [ ] superAdminApi vérifie SUPERADMIN avant chaque call
- [ ] adminApi vérifie ADMIN avant chaque call
- [ ] Toutes les requêtes incluent Authorization header

### Error Handling
- [ ] Messages d'erreur clairs (pas "Invalid credentials" partout)
- [ ] Toast notifications pour tous les échecs de sécurité
- [ ] Console.error pour debug (avec détails du rôle/user)
- [ ] Redirection automatique vers le bon dashboard après erreur

---

## 📦 FICHIERS À MODIFIER (ORDRE DE PRIORITÉ)

### 🔴 CRITIQUE - À faire EN PREMIER
1. `frontend/src/pages/Login.tsx` - Validation complète
2. `frontend/src/contexts/AuthContext.tsx` - Normalisation rôle
3. `frontend/src/components/PrivateRoute.tsx` - Validation schoolId

### 🟡 IMPORTANT - À faire ENSUITE
4. `frontend/src/pages/SuperAdminDashboard.tsx` - Route guard
5. `frontend/src/pages/AdminDashboard.tsx` - Route guard
6. `frontend/src/pages/TeacherDashboard.tsx` - Route guard
7. `frontend/src/pages/StudentDashboard.tsx` - Route guard (déjà fait)

### 🟢 RECOMMANDÉ - À faire APRÈS
8. `frontend/src/lib/api.ts` - requireRole() helper
9. Tous les autres dashboards/pages avec logique métier

---

## 🧪 TESTS À EFFECTUER APRÈS CORRECTIONS

### Test Scenario 1: Login Admin
1. Login avec compte ADMIN
2. ✅ Doit être redirigé vers `/school/{schoolId}/admin/dashboard`
3. ✅ Ne DOIT PAS pouvoir accéder à `/superadmin/dashboard`
4. ✅ Ne DOIT PAS pouvoir accéder à une autre école `/school/autre-id/admin/dashboard`

### Test Scenario 2: Login SuperAdmin
1. Login avec compte SUPERADMIN
2. ✅ Doit être redirigé vers `/superadmin/dashboard`
3. ✅ Ne DOIT PAS être redirigé vers `/school/*/admin/dashboard`

### Test Scenario 3: Manipulation localStorage
1. Login en tant que STUDENT
2. Modifier manuellement localStorage: `role: "SUPERADMIN"`
3. Rafraîchir la page
4. ✅ checkAuth() doit détecter l'incohérence et déconnecter l'utilisateur

### Test Scenario 4: Token Expiré
1. Login réussi
2. Attendre expiration du token (ou le supprimer)
3. Essayer d'accéder à une page protégée
4. ✅ Doit être redirigé vers /login avec message clair

### Test Scenario 5: URL Manipulation
1. Login en tant que ADMIN de school-1
2. Modifier URL manuellement pour `/school/school-2/admin/dashboard`
3. ✅ PrivateRoute doit bloquer et rediriger vers school-1

---

## 🚀 PLAN D'IMPLÉMENTATION

### Phase 1: Corrections Critiques (1-2h)
- Modifier Login.tsx avec validation complète
- Modifier AuthContext.tsx avec normalisation
- Modifier PrivateRoute.tsx avec schoolId check

### Phase 2: Route Guards (1h)
- Ajouter validation dans chaque dashboard
- Tester tous les scénarios de redirection

### Phase 3: API Security (30min)
- Ajouter requireRole() dans api.ts
- Protéger les endpoints sensibles

### Phase 4: Tests & Validation (1h)
- Exécuter tous les tests scenarios
- Fixer les bugs trouvés
- Documenter les changements

---

## ⚠️ NOTES IMPORTANTES

1. **TOUJOURS** utiliser `replace: true` dans navigate() après sécurité
2. **TOUJOURS** normaliser le rôle avec normalizeRole() avant comparaison
3. **TOUJOURS** vérifier schoolId pour routes ADMIN/TEACHER
4. **JAMAIS** faire confiance au localStorage seul (toujours valider avec backend)
5. **JAMAIS** rediriger sans valider le token d'abord

---

## 📚 RESSOURCES

- Fichier de référence: `frontend/src/lib/roleUtils.ts`
- Documentation JWT: Backend JwtUtil.java
- Pattern de sécurité: PrivateRoute.tsx (à améliorer)

