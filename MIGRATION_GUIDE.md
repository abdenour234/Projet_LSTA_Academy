# Frontend Migration Guide - Supabase to Spring Boot

## Migration Status

### ✅ Completed Migrations

1. **Core API Client** (`frontend/src/lib/api.ts`)
   - Created comprehensive Spring Boot REST API client
   - JWT token management in localStorage
   - Auto-redirect on 401 errors
   - HTTP methods: GET, POST, PUT, DELETE, PATCH
   - File upload support with FormData
   - Organized API endpoints by resource type

2. **File Upload Utility** (`frontend/src/lib/uploadToStorage.ts`)
   - Migrated from Supabase Storage to Spring Boot `/api/storage`
   - Support for activity files and school logos
   - Signed URL generation
   - File deletion

3. **School Form Dialog** (`frontend/src/components/SchoolFormDialog.tsx`)
   - Uses `schoolApi.create()` and `schoolApi.update()`
   - Logo upload via `uploadSchoolLogo()`
   - Proper error handling

4. **Index Page** (`frontend/src/pages/Index.tsx`)
   - Fetches schools via `schoolApi.getAll()`
   - Removed Supabase dependency

5. **School Login Page** (`frontend/src/pages/SchoolLogin.tsx`)
   - Uses `authApi.login()` for authentication
   - JWT token stored in localStorage
   - Role-based routing (ADMIN/TEACHER)
   - School verification

### ⚠️ Pending Migrations

The following files still use Supabase and need migration:

#### Dashboard Pages
- `frontend/src/pages/AdminDashboard.tsx` - Admin interface
- `frontend/src/pages/TeacherDashboard.tsx` - Teacher interface

#### Activity Management
- `frontend/src/pages/ActivityView.tsx`
- `frontend/src/pages/ActivityEditor.tsx`
- `frontend/src/components/activity/ActivityBuilder.tsx`

#### Resource Viewers
- `frontend/src/components/activity/VideoViewer.tsx`
- `frontend/src/components/activity/PDFViewer.tsx`

#### Statistics & Admin
- `frontend/src/components/admin/AdminStatsCards.tsx`

#### Other Pages (lower priority)
- `frontend/src/pages/TeacherSessions.tsx`
- `frontend/src/pages/ResourceManagement.tsx`
- `frontend/src/pages/TeacherManagement.tsx`
- `frontend/src/pages/MessagingPage.tsx`
- `frontend/src/pages/ClassManagement.tsx`
- `frontend/src/pages/ActivityTracking.tsx`

## Migration Pattern

For each file, follow this pattern:

### 1. Replace Import
```typescript
// OLD
import { supabase } from '@/integrations/supabase/client';

// NEW
import { authApi, schoolApi, activityApi, classApi, teacherApi } from '@/lib/api';
```

### 2. Replace Auth Calls
```typescript
// OLD
const { data: { user } } = await supabase.auth.getUser();

// NEW
const user = await authApi.getCurrentUser();
```

### 3. Replace Data Queries
```typescript
// OLD
const { data } = await supabase
  .from('schools')
  .select('*')
  .eq('id', schoolId)
  .single();

// NEW
const school = await schoolApi.getById(schoolId);
```

### 4. Replace Inserts
```typescript
// OLD
const { error } = await supabase
  .from('schools')
  .insert([schoolData]);

// NEW
await schoolApi.create(schoolData);
```

### 5. Replace Updates
```typescript
// OLD
const { error } = await supabase
  .from('schools')
  .update(updates)
  .eq('id', id);

// NEW
await schoolApi.update(id, updates);
```

### 6. Replace Deletes
```typescript
// OLD
const { error } = await supabase
  .from('schools')
  .delete()
  .eq('id', id);

// NEW
await schoolApi.delete(id);
```

### 7. Replace File Uploads
```typescript
// OLD
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload(filePath, file);

// NEW
const result = await uploadActivityFile(file, activityId);
// or
const result = await uploadSchoolLogo(file, schoolId);
```

### 8. Replace Storage URLs
```typescript
// OLD
const { data: { publicUrl } } = supabase.storage
  .from('bucket')
  .getPublicUrl(filePath);

// NEW
const url = await getPublicUrl(fileName);
// or for synchronous (may need auth)
const url = getPublicUrlSync(fileName);
```

## API Endpoints Reference

### Available APIs in `lib/api.ts`

#### Authentication (`authApi`)
- `login(email, password)` - Login and get JWT token
- `logout()` - Logout and clear token
- `getCurrentUser()` - Get current user info
- `register(userData)` - Register new user

#### Schools (`schoolApi`)
- `getAll()` - Get all schools
- `getById(id)` - Get school by ID
- `create(school)` - Create new school
- `update(id, school)` - Update school
- `delete(id)` - Delete school
- `uploadLogo(schoolId, file)` - Upload school logo

#### Activities (`activityApi`)
- `getAll()` - Get all activities
- `getById(id)` - Get activity by ID
- `create(activity)` - Create new activity
- `update(id, activity)` - Update activity
- `delete(id)` - Delete activity
- `uploadResource(activityId, file)` - Upload activity resource

#### Classes (`classApi`)
- `getAll()` - Get all classes
- `getBySchoolId(schoolId)` - Get classes by school
- `getById(id)` - Get class by ID
- `create(classData)` - Create new class
- `update(id, classData)` - Update class
- `delete(id)` - Delete class

#### Teachers (`teacherApi`)
- `getAll()` - Get all teachers
- `getBySchoolId(schoolId)` - Get teachers by school
- `getById(id)` - Get teacher by ID
- `create(teacher)` - Create new teacher
- `update(id, teacher)` - Update teacher
- `delete(id)` - Delete teacher

#### Sessions (`sessionApi`)
- `getAll()` - Get all sessions
- `getByTeacherId(teacherId)` - Get sessions by teacher
- `getById(id)` - Get session by ID
- `create(session)` - Create new session
- `update(id, session)` - Update session
- `delete(id)` - Delete session

#### Storage (`storageApi`)
- `upload(file, entityType, entityId)` - Upload file
- `getSignedUrl(fileName)` - Get signed URL
- `delete(fileName)` - Delete file

#### Statistics (`statsApi`)
- `getAdminStats()` - Get admin statistics
- `getSchoolStats(schoolId)` - Get school statistics
- `getTeacherStats(teacherId)` - Get teacher statistics

## Environment Variables

Create `.env` in frontend directory:

```env
VITE_API_URL=http://localhost:8080/api
```

For production:
```env
VITE_API_URL=https://your-domain.com/api
```

## Testing Checklist

After migration, test:
- [ ] Login with admin credentials
- [ ] Login with teacher credentials
- [ ] View schools list
- [ ] Create new school
- [ ] Upload school logo
- [ ] View admin dashboard
- [ ] View teacher dashboard
- [ ] Create activity
- [ ] Upload activity resources
- [ ] View activity
- [ ] Edit activity
- [ ] Delete activity
- [ ] Token expiration (logout after 24h)
- [ ] 401 handling (auto-redirect to login)

## Known Issues / Notes

1. **Supabase Realtime**: Spring Boot doesn't have built-in realtime like Supabase. For real-time features, consider:
   - WebSockets (Spring WebSocket)
   - Server-Sent Events (SSE)
   - Polling (simpler but less efficient)

2. **Row-Level Security**: Supabase RLS needs to be replicated in Spring Boot controllers with proper authorization checks.

3. **Schema Differences**: Backend entity field names may use camelCase while Supabase used snake_case. Adjust as needed.

4. **File Storage**: Backend uses MinIO instead of Supabase Storage. URLs will be different format.

## Next Steps

1. Complete remaining page migrations (AdminDashboard, TeacherDashboard, etc.)
2. Add Spring Boot endpoints that don't exist yet
3. Test all functionality
4. Remove @supabase/supabase-js dependency from package.json
5. Update Docker environment variables for production
