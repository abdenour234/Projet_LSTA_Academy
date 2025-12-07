# 🔧 Guide de Dépannage - Messagerie Interne

## ✅ PROBLÈMES CORRIGÉS

### 1. **Erreur 500 + Double `/api/api` dans les URLs**

**❌ Avant:**
```
/api/api/conversations?schoolId=7  ← ERREUR: double /api/
```

**✅ Après:**
```
/api/messaging/conversations?page=0&size=20  ← CORRECT
```

**Cause:** 
- `API_BASE_URL` contient déjà `/api`
- Les endpoints ajoutaient encore `/api/` en préfixe

**Solution:**
```typescript
// messagingApi.ts - AVANT (INCORRECT)
await api.get(`/api/messaging/conversations?page=${page}`)

// messagingApi.ts - APRÈS (CORRECT)
await api.get(`/messaging/conversations?page=${page}`)
```

---

### 2. **`Cannot read properties of undefined (reading 'ok')`**

**Cause:**
```typescript
// AVANT - response.data était undefined
const response = await api.post(...);
return response.data;  // ← undefined si erreur
```

**Solution:**
```typescript
// APRÈS - retour direct sans .data
const response = await api.post<Conversation>(...);
return response;  // ← pas de .data
```

**Pourquoi?**
- La fonction `request<T>()` dans `api.ts` retourne déjà `T` (les données parsées)
- Pas besoin d'accéder à `.data`

---

### 3. **FormData non supporté pour upload fichiers**

**Problème:**
```typescript
// Content-Type: application/json était forcé même pour FormData
headers['Content-Type'] = 'application/json';  // ❌ Crash avec FormData
```

**Solution:**
```typescript
// api.post() détecte FormData automatiquement
if (data instanceof FormData) {
  return request<T>(endpoint, {
    method: 'POST',
    body: data,
    // ✅ Pas de Content-Type - browser ajoute boundary automatiquement
  });
}
```

---

### 4. **`schoolId` manquant ou incorrect**

**Problème:**
```typescript
const schoolId = user?.schoolId || 1;  // ❌ Parfois undefined
```

**Solution:**
```typescript
// Extraction sécurisée avec fallbacks multiples
const schoolId = user?.schoolId || user?.school_id || 1;

console.log('[MESSAGING] User context:', { 
  userId: user?.id, 
  schoolId,  // ✅ Toujours défini
  role: user?.role 
});
```

---

## 📋 CHECKLIST DE VÉRIFICATION

### **Backend (Spring Boot)**

- [ ] **Serveur démarré** sur port 8080
  ```bash
  curl http://localhost:8080/actuator/health
  # Doit retourner: {"status":"UP"}
  ```

- [ ] **Base de données initialisée**
  - Tables: `conversations`, `messages`, `message_attachments`
  - Trigger: `update_conversation_last_message()`
  - Indexes créés

- [ ] **MinIO démarré** sur port 9000/9001
  ```bash
  curl http://localhost:9000/minio/health/live
  ```

- [ ] **JWT Token valide**
  - Token dans `localStorage.getItem('token')`
  - Rôle: TEACHER ou ADMIN

### **Frontend (React)**

- [ ] **Dependencies installées**
  ```bash
  cd frontend
  npm install @stomp/stompjs sockjs-client date-fns
  ```

- [ ] **Variables d'environnement**
  ```env
  # frontend/.env
  VITE_API_URL=http://localhost:8080/api
  ```

- [ ] **Utilisateur connecté**
  - `localStorage.getItem('token')` existe
  - `localStorage.getItem('user')` contient `{ id, schoolId, role }`

---

## 🔍 DEBUGGING ÉTAPE PAR ÉTAPE

### **Étape 1: Vérifier l'authentification**

**Console Browser:**
```javascript
// Ouvrir DevTools > Console
console.log('Token:', localStorage.getItem('token'));
console.log('User:', JSON.parse(localStorage.getItem('user')));

// Doit afficher:
// Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// User: { id: "uuid", schoolId: 7, role: "TEACHER", ... }
```

---

### **Étape 2: Tester l'API manuellement**

**GET Conversations:**
```bash
curl -X GET "http://localhost:8080/api/messaging/conversations?page=0&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0,
  "hasNext": false,
  "hasPrevious": false
}
```

---

### **Étape 3: Vérifier les logs console**

**Logs normaux dans Console:**
```
[MESSAGING] User context: { userId: "uuid", schoolId: 7, role: "TEACHER" }
[MESSAGING] Loading conversations for user: uuid
[API] Request: { method: "GET", url: "http://localhost:8080/api/messaging/conversations?page=0&size=20", hasBody: false }
[API] Response: { status: 200, ok: true, url: "..." }
[MESSAGING] Conversations loaded: { content: [], page: 0, ... }
```

**Logs d'erreur (si problème):**
```
[API] Response: { status: 500, ok: false, url: "..." }
[API] Error response: { status: 500, message: "...", data: {...} }
[MESSAGING] Failed to load conversations: ApiError {...}
```

---

### **Étape 4: Vérifier le WebSocket**

**Console:**
```
✅ WebSocket connected
📨 New message received: { id: "...", ... }
```

**Si déconnecté:**
```
❌ STOMP error: ...
🔌 WebSocket connection closed
```

**Test manuel:**
```javascript
// Dans la console
const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  connectHeaders: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  },
  onConnect: () => console.log('✅ Connected'),
  onStompError: (e) => console.error('❌ Error:', e)
});
client.activate();
```

---

## 🐛 ERREURS COURANTES

### **Erreur: "Failed to load resource: 500"**

**Cause possible:**
- Table `conversations` n'existe pas
- Contrainte unique violée
- User n'a pas le rôle TEACHER/ADMIN

**Solution:**
```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%conversation%';

-- Doit retourner: conversations, messages, message_attachments
```

---

### **Erreur: "Cannot read properties of undefined"**

**Cause:**
- Accès à `response.data` au lieu de `response`
- `content` undefined dans PagedResponse

**Solution:**
```typescript
// ✅ CORRECT
const response = await messagingService.getConversations();
setConversations(response.content || []);  // Fallback sur []

// ❌ INCORRECT
setConversations(response.content);  // Crash si undefined
```

---

### **Erreur: "Missing or invalid Authorization header"**

**Cause:**
- Token expiré
- Token manquant dans localStorage

**Solution:**
```javascript
// Vérifier le token
const token = localStorage.getItem('token');
if (!token) {
  console.error('❌ No token - user must login');
  window.location.href = '/login';
}
```

---

### **Erreur: "Access denied to this school"**

**Cause:**
- `schoolId` dans requête ≠ `user.schoolId`

**Solution:**
```typescript
// frontend/src/pages/MessagingDashboard.tsx
const schoolId = user?.schoolId || user?.school_id || 1;

// Toujours utiliser cette variable, jamais hardcoder
await messagingService.sendMessage({ ... }, schoolId);  // ✅
await messagingService.sendMessage({ ... }, 7);         // ❌
```

---

## 📊 MONITORING EN PRODUCTION

### **Logs Backend à surveiller:**

```java
// ConversationController
log.info("GET /conversations - User: {}, SchoolId: {}", userId, schoolId);
log.error("Error loading conversations", exception);
```

### **Métriques à suivre:**

- Nombre de conversations créées / jour
- Messages envoyés / jour
- Upload de fichiers réussis vs échecs
- Temps de réponse moyen des endpoints
- Erreurs 500 dans les logs

---

## 🔄 TESTS COMPLETS

### **Test 1: Créer une conversation**

```typescript
// 1. Se connecter en tant que TEACHER
// 2. Aller sur /messaging
// 3. Vérifier les logs:
console.log('[MESSAGING] User context:', { userId, schoolId, role });
// 4. Doit charger sans erreur
```

### **Test 2: Envoyer un message**

```typescript
// 1. Sélectionner ou créer une conversation
// 2. Écrire un message + ajouter un fichier
// 3. Cliquer "Envoyer"
// 4. Vérifier les logs:
[MESSAGING] Sending message: { conversationId, schoolId, hasAttachments: true }
[API] Request: { method: "POST", url: "/messaging/enhanced?schoolId=7" }
[API] Response: { status: 200, ok: true }
```

### **Test 3: Recevoir un message (WebSocket)**

```typescript
// 1. Ouvrir 2 fenêtres (2 users différents)
// 2. User A envoie message
// 3. User B doit recevoir notification:
📨 New message received: { ... }
Toast: "Nouveau message"
```

---

## ✅ RÉSUMÉ DES CORRECTIONS

| Problème | Correction | Fichier |
|----------|-----------|---------|
| Double `/api/api` | Retirer `/api/` des endpoints | `messagingApi.ts` |
| `undefined.ok` | Retourner `response` au lieu de `response.data` | `messagingApi.ts` |
| FormData crash | Détecter `instanceof FormData` | `api.ts` |
| schoolId manquant | Extraction sécurisée avec fallbacks | `MessagingDashboard.tsx` |
| Pas de logs | Ajout `console.log` partout | Tous les fichiers |
| Erreurs silencieuses | Catch + toast + console.error | `MessagingDashboard.tsx` |

---

## 📞 SUPPORT

**En cas de problème persistant:**

1. Vérifier les **3 commits récents:**
   ```bash
   git log --oneline -3
   # feat(messaging-frontend): Add React frontend...
   # chore(frontend): Add WebSocket dependencies...
   # fix(messaging): Correction complète du système...
   ```

2. **Copier les logs console** complets
3. **Screenshot de l'erreur** dans Network tab
4. **Vérifier la branche:** `git branch` → doit être sur `test_prod` ou `feature/internal-messaging`

---

**Dernière mise à jour:** 7 décembre 2025  
**Version:** 2.0 (Corrections complètes)
