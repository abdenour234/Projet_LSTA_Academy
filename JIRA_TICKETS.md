# 🎫 LSTA Academy - JIRA Sprint Planning Tickets

**Sprint**: Critical Fixes & Security Hardening  
**Project**: LSTA-ACADEMY  
**Date**: October 26, 2025  
**Sprint Duration**: 2 weeks  
**Total Story Points**: 89

---

## 📊 SPRINT OVERVIEW

| Priority | Tickets | Story Points | Estimated Hours |
|----------|---------|--------------|-----------------|
| 🔴 Critical | 13 | 55 | 110h |
| ⚠️ High | 10 | 21 | 42h |
| 🟡 Medium | 8 | 13 | 26h |
| **TOTAL** | **31** | **89** | **178h** |

**Team Velocity**: ~40 SP/sprint  
**Recommended**: Split into 3 sprints

---

## 🔴 CRITICAL PRIORITY TICKETS (Sprint 1)

### LSTA-001: Implement JWT Authentication Filter & Enable Security
**Type**: Bug - Security  
**Priority**: 🔴 CRITICAL  
**Story Points**: 8  
**Assignee**: Backend Lead  
**Sprint**: Sprint 1  

**Description**:
The application currently has authentication completely disabled. All endpoints are publicly accessible without any JWT token validation, creating a catastrophic security vulnerability.

**Current State**:
```java
// SecurityConfig.java
.anyRequest().permitAll()  // ❌ All requests allowed
```

**Acceptance Criteria**:
- [ ] Create `JwtAuthenticationFilter` extending `OncePerRequestFilter`
- [ ] Implement token extraction from Authorization header
- [ ] Add JWT validation logic (signature, expiration)
- [ ] Set Authentication in SecurityContext
- [ ] Register filter in SecurityConfig
- [ ] Update SecurityConfig to `.anyRequest().authenticated()`
- [ ] Add role-based authorization rules
- [ ] Test all protected endpoints require valid JWT

**Technical Tasks**:
- [ ] Create `com.schoolmanagement.security.JwtAuthenticationFilter.java`
- [ ] Implement `doFilterInternal()` method
- [ ] Add filter to security chain: `http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`
- [ ] Configure role-based access:
  - `/api/superadmin/**` → `ROLE_SUPERADMIN`
  - `/api/school/*/admin/**` → `ROLE_ADMIN`
  - `/api/school/*/teacher/**` → `ROLE_TEACHER`
  - `/api/student/**` → `ROLE_STUDENT`
- [ ] Write unit tests for filter
- [ ] Integration tests for protected endpoints

**Dependencies**: None  
**Blocked By**: None  
**Blocks**: LSTA-003, LSTA-004

**Definition of Done**:
- Unauthorized requests return 401
- Invalid tokens return 401
- Valid tokens allow access to authorized endpoints only
- All tests pass
- Code reviewed and approved

---

### LSTA-002: Fix File Upload/Download System - MinIO Integration
**Type**: Bug - Critical Feature  
**Priority**: 🔴 CRITICAL  
**Story Points**: 8  
**Assignee**: Backend Developer  
**Sprint**: Sprint 1  

**Description**:
PDF documents and files uploaded to the system cannot be retrieved or viewed. Students cannot access learning materials. The issue stems from incomplete MinIO migration and fake signed URL implementation.

**Current Issues**:
1. GET `/api/storage/files/{id}` returns 500 error
2. Signed URLs are fake (just paths, not pre-signed)
3. Old files from local filesystem lost

**Acceptance Criteria**:
- [ ] Files upload successfully to MinIO ✅ (already working)
- [ ] Files can be retrieved without errors
- [ ] Implement real MinIO pre-signed URLs
- [ ] PDF viewer displays uploaded documents
- [ ] File downloads work correctly
- [ ] Set proper content-type headers
- [ ] Add file size limits (10MB)
- [ ] Handle file not found gracefully

**Technical Tasks**:
- [ ] Debug `StorageController.getFile()` - fix 500 error
- [ ] Implement real signed URLs using MinIO SDK:
  ```java
  String url = minioClient.getPresignedObjectUrl(
      GetPresignedObjectUrlArgs.builder()
          .method(Method.GET)
          .bucket(bucketName)
          .object(filename)
          .expiry(3600, TimeUnit.SECONDS)
          .build()
  );
  ```
- [ ] Add content-type detection
- [ ] Add file size validation
- [ ] Test with various file types (PDF, images, docs)
- [ ] Add error handling and logging

**Test Cases**:
1. Upload 5MB PDF → Success
2. Upload 15MB file → Error (too large)
3. Retrieve uploaded file → Success, correct content-type
4. View PDF in browser → Displays correctly
5. Download file → Downloads with correct name
6. Request non-existent file → 404 error

**Dependencies**: None  
**Definition of Done**:
- All file operations work without errors
- PDF viewer functional
- Signed URLs expire after 1 hour
- Tests pass
- Documentation updated

---

### LSTA-003: Add Frontend Authentication Guards & Route Protection
**Type**: Bug - Security  
**Priority**: 🔴 CRITICAL  
**Story Points**: 5  
**Assignee**: Frontend Lead  
**Sprint**: Sprint 1  
**Dependencies**: LSTA-001

**Description**:
Protected routes are accessible without authentication. Users can navigate to admin dashboards, student areas, etc., without logging in.

**Acceptance Criteria**:
- [ ] Create `PrivateRoute` wrapper component
- [ ] Implement `useAuth` hook for authentication state
- [ ] Add role-based route protection
- [ ] Redirect unauthenticated users to /login
- [ ] Redirect unauthorized users (wrong role) to appropriate page
- [ ] Persist authentication state across page refreshes
- [ ] Show loading state while checking auth

**Technical Tasks**:
- [ ] Create `src/hooks/useAuth.tsx`:
  ```typescript
  export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    // ... implementation
  };
  ```
- [ ] Create `src/components/PrivateRoute.tsx`:
  ```typescript
  interface PrivateRouteProps {
    children: React.ReactNode;
    requiredRole?: 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  }
  ```
- [ ] Wrap protected routes in App.tsx
- [ ] Add AuthContext provider
- [ ] Implement token validation on mount
- [ ] Add auto-logout on token expiration

**Routes to Protect**:
- `/superadmin/*` → SUPERADMIN only
- `/school/:id/admin/*` → ADMIN only
- `/school/:id/teacher/*` → TEACHER only
- `/student/*` → STUDENT only

**Definition of Done**:
- Cannot access protected routes without auth
- Correct role required for each route
- Smooth redirect experience
- Tests pass

---

### LSTA-004: Implement Role-Based Access Control (RBAC)
**Type**: Feature - Security  
**Priority**: 🔴 CRITICAL  
**Story Points**: 8  
**Assignee**: Backend Lead + Frontend Lead  
**Sprint**: Sprint 1  
**Dependencies**: LSTA-001

**Description**:
Users can currently access any endpoint regardless of their role. Need to implement proper role-based access control on both backend and frontend.

**Acceptance Criteria**:

**Backend**:
- [ ] Add `@PreAuthorize` annotations to all controllers
- [ ] Verify user role matches required role
- [ ] Return 403 Forbidden for unauthorized access
- [ ] Test role enforcement on all endpoints

**Frontend**:
- [ ] Hide/show UI elements based on user role
- [ ] Disable actions user cannot perform
- [ ] Show appropriate error messages

**Technical Tasks**:

**Backend**:
- [ ] Enable method security in SecurityConfig:
  ```java
  @EnableMethodSecurity(prePostEnabled = true)
  ```
- [ ] Add role checks to controllers:
  ```java
  @PreAuthorize("hasRole('ADMIN')")
  @PostMapping("/students")
  ```
- [ ] Define role hierarchy if needed
- [ ] Test each protected endpoint

**Frontend**:
- [ ] Create role-checking utilities
- [ ] Conditional rendering based on role
- [ ] Disable buttons for unauthorized actions

**Test Matrix**:
| Endpoint | SUPERADMIN | ADMIN | TEACHER | STUDENT |
|----------|------------|-------|---------|---------|
| GET /api/superadmin/stats | ✅ | ❌ | ❌ | ❌ |
| POST /api/school/1/students | ✅ | ✅ | ❌ | ❌ |
| GET /api/student/me | ❌ | ❌ | ❌ | ✅ |

**Definition of Done**:
- All endpoints enforce role checks
- 403 returned for unauthorized access
- Frontend prevents unauthorized actions
- Tests cover all role combinations

---

### LSTA-005: Change Default Credentials & Strengthen JWT Secret
**Type**: Bug - Security  
**Priority**: 🔴 CRITICAL  
**Story Points**: 3  
**Assignee**: DevOps/Backend  
**Sprint**: Sprint 1  

**Description**:
Application uses default credentials and weak JWT secret in docker-compose.yml, creating critical security vulnerabilities.

**Current Issues**:
```yaml
POSTGRES_PASSWORD: postgres  # Default
MINIO_ROOT_PASSWORD: minioadmin  # Default
JWT_SECRET: your-very-secure-secret-key...  # Weak
```

**Acceptance Criteria**:
- [ ] Generate cryptographically secure 512-bit JWT secret
- [ ] Create strong passwords for PostgreSQL
- [ ] Create strong passwords for MinIO
- [ ] Move secrets to environment variables
- [ ] Create `.env.example` file
- [ ] Document secret generation process
- [ ] Update deployment documentation

**Technical Tasks**:
- [ ] Generate JWT secret:
  ```bash
  openssl rand -base64 64
  ```
- [ ] Generate strong passwords (min 32 chars)
- [ ] Create `.env` file (gitignored)
- [ ] Update `docker-compose.yml`:
  ```yaml
  JWT_SECRET: ${JWT_SECRET}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
  ```
- [ ] Create `.env.example` with placeholders
- [ ] Update README with setup instructions
- [ ] Rotate all existing tokens/sessions

**Definition of Done**:
- No hardcoded credentials in codebase
- All secrets in environment variables
- Documentation updated
- Secrets meet security requirements

---

### LSTA-006: Fix CSV Student Import Functionality
**Type**: Bug - Critical Feature  
**Priority**: 🔴 CRITICAL  
**Story Points**: 5  
**Assignee**: Full-Stack Developer  
**Sprint**: Sprint 1  

**Description**:
Bulk student import via CSV fails silently or with unclear errors. This is a critical workflow for school administrators setting up classes.

**Current Issues**:
- No CSV structure validation
- Duplicate emails cause silent failures
- No preview before import
- No detailed error reporting

**Acceptance Criteria**:
- [ ] Validate CSV structure before import
- [ ] Show preview of data to be imported
- [ ] Handle duplicate emails gracefully
- [ ] Provide detailed error report (row-by-row)
- [ ] Allow partial import with error report
- [ ] Add rollback on critical errors
- [ ] Show progress indicator
- [ ] Limit file size (5MB max)

**CSV Format**:
```csv
firstName,lastName,email,dateOfBirth,grade
John,Doe,john.doe@school.com,2010-05-15,6
```

**Technical Tasks**:

**Frontend** (`ClassManagement.tsx`):
- [ ] Add CSV file size validation
- [ ] Parse CSV client-side for preview
- [ ] Show preview modal before import
- [ ] Display import progress
- [ ] Show detailed error results

**Backend**:
- [ ] Create CSV parser with validation
- [ ] Validate email format
- [ ] Check for duplicate emails
- [ ] Return detailed validation results
- [ ] Implement transaction rollback on errors
- [ ] Add row-by-row error reporting

**API Response Format**:
```json
{
  "success": true,
  "imported": 45,
  "failed": 5,
  "errors": [
    {"row": 3, "error": "Duplicate email: john@example.com"},
    {"row": 7, "error": "Invalid date format"}
  ]
}
```

**Test Cases**:
1. Valid CSV with 50 students → All imported
2. CSV with 2 duplicates → Import others, report errors
3. CSV with invalid format → Reject before import
4. CSV larger than 5MB → Reject
5. Empty CSV → Clear error message

**Definition of Done**:
- CSV import works reliably
- Users see clear error messages
- Preview shows data before import
- Tests pass

---

### LSTA-007: Add Input Validation - Backend & Frontend
**Type**: Bug - Security & Quality  
**Priority**: 🔴 CRITICAL  
**Story Points**: 8  
**Assignee**: Full-Stack Team  
**Sprint**: Sprint 1  

**Description**:
No input validation on forms or API endpoints. Backend accepts any data, creating security risks and data quality issues.

**Acceptance Criteria**:

**Backend**:
- [ ] Add `@Valid` annotations to all DTOs
- [ ] Create validation constraints for all fields
- [ ] Return clear validation error messages
- [ ] Sanitize inputs to prevent injection

**Frontend**:
- [ ] Implement form validation with Zod
- [ ] Show inline error messages
- [ ] Prevent submission of invalid forms
- [ ] Add client-side sanitization

**Technical Tasks**:

**Backend - Create DTOs**:
```java
public class StudentDTO {
    @NotBlank(message = "First name is required")
    @Size(min = 2, max = 50)
    private String firstName;
    
    @Email(message = "Invalid email format")
    private String email;
    
    @Past(message = "Birth date must be in the past")
    private LocalDate dateOfBirth;
}
```

**Backend - Update Controllers**:
```java
@PostMapping
public ResponseEntity<?> create(@Valid @RequestBody StudentDTO dto) {
    // ...
}
```

**Frontend - Create Zod Schemas**:
```typescript
const studentSchema = z.object({
  firstName: z.string().min(2).max(50),
  email: z.string().email(),
  dateOfBirth: z.date().max(new Date()),
});
```

**Forms to Validate**:
- [ ] Student creation/edit
- [ ] Teacher creation/edit
- [ ] Class creation/edit
- [ ] Activity creation/edit
- [ ] Login/signup forms
- [ ] Profile update

**Validation Rules**:
- Email: Valid format, max 100 chars
- Names: Min 2, max 50 chars
- Passwords: Min 8 chars, 1 uppercase, 1 number
- Dates: Valid format, logical ranges
- Phone: Valid format
- URLs: Valid format

**Definition of Done**:
- All forms validate input
- Backend rejects invalid data
- Clear error messages shown
- SQL injection prevented
- XSS prevented

---

### LSTA-008: Implement Token Blacklist & Proper Logout
**Type**: Bug - Security  
**Priority**: 🔴 CRITICAL  
**Story Points**: 5  
**Assignee**: Backend Developer  
**Sprint**: Sprint 1  

**Description**:
JWT tokens remain valid after logout, creating security risks. Need to implement token blacklisting or refresh token mechanism.

**Acceptance Criteria**:
- [ ] Implement token blacklist in Redis or database
- [ ] Invalidate token on logout
- [ ] Check blacklist on each request
- [ ] Auto-clean expired tokens from blacklist
- [ ] Implement token refresh mechanism (optional)

**Technical Tasks**:
- [ ] Add Redis dependency (or use database)
- [ ] Create BlacklistedToken entity:
  ```java
  @Entity
  public class BlacklistedToken {
      @Id
      private String token;
      private LocalDateTime expiresAt;
  }
  ```
- [ ] Update JWT filter to check blacklist
- [ ] Implement logout endpoint:
  ```java
  @PostMapping("/logout")
  public ResponseEntity<?> logout(@RequestHeader("Authorization") String token) {
      blacklistService.addToken(token);
      return ResponseEntity.ok("Logged out");
  }
  ```
- [ ] Add scheduled task to clean expired tokens
- [ ] Update frontend logout to call API

**Alternative Approach** (if Redis not available):
- Use database table for blacklist
- Add cleanup scheduled task

**Definition of Done**:
- Logout invalidates token
- Old tokens cannot be reused
- Expired tokens auto-removed
- Performance not impacted

---

### LSTA-009: Add Database Indexes for Performance
**Type**: Task - Performance  
**Priority**: 🔴 HIGH  
**Story Points**: 3  
**Assignee**: Database Admin/Backend  
**Sprint**: Sprint 1  

**Description**:
Missing foreign key indexes causing slow queries and poor performance. Large schools will experience significant slowdowns.

**Current Impact**:
- School with 1000 students: 3-5 second page loads
- Joins on unindexed columns very slow
- Cascading deletes take minutes

**Acceptance Criteria**:
- [ ] Add indexes on all foreign keys
- [ ] Add indexes on frequently queried columns
- [ ] Create composite indexes where needed
- [ ] Test query performance improvement
- [ ] Document index strategy

**Indexes to Create**:
```sql
-- Foreign Key Indexes
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_activities_school_id ON activities(school_id);
CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_sessions_teacher_id ON teaching_sessions(teacher_id);
CREATE INDEX idx_sessions_class_id ON teaching_sessions(class_id);

-- Query Optimization Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX idx_students_created_at ON students(created_at DESC);

-- Composite Indexes
CREATE INDEX idx_students_school_class ON students(school_id, class_id);
CREATE INDEX idx_activities_school_type ON activities(school_id, type);
```

**Performance Testing**:
- [ ] Measure query times before indexes
- [ ] Create indexes
- [ ] Measure query times after indexes
- [ ] Document improvement percentages

**Expected Results**:
- Student list query: 3s → <200ms
- Activity search: 2s → <100ms
- School dashboard: 5s → <500ms

**Definition of Done**:
- All indexes created
- Query performance improved by >80%
- No negative impact on writes
- Documented

---

### LSTA-010: Fix Student Dashboard - Load Activities
**Type**: Bug - Critical Feature  
**Priority**: 🔴 CRITICAL  
**Story Points**: 5  
**Assignee**: Full-Stack Developer  
**Sprint**: Sprint 1  

**Description**:
Student dashboard shows empty activity list. Students cannot see their assigned work, making the platform unusable for the primary user group.

**Root Causes**:
1. Missing endpoint: `/api/student/activities` or `/api/student/me/activities`
2. Activity-Class assignment table might not exist
3. Frontend not handling API response correctly

**Acceptance Criteria**:
- [ ] Create endpoint to fetch student's activities
- [ ] Filter activities by student's class
- [ ] Show activity details (title, description, due date)
- [ ] Display activity status (completed/pending)
- [ ] Handle empty state gracefully
- [ ] Add pagination for many activities
- [ ] Show loading state

**Technical Tasks**:

**Backend**:
- [ ] Create endpoint:
  ```java
  @GetMapping("/api/student/me/activities")
  public ResponseEntity<List<ActivityDTO>> getMyActivities(
      @AuthenticationPrincipal UserDetails user) {
      // Get student
      // Get student's class
      // Get activities assigned to class
      // Return activities
  }
  ```
- [ ] Create activity-class join table if missing
- [ ] Add pagination support
- [ ] Order by due date

**Frontend** (`StudentDashboard.tsx`):
- [ ] Fix API call endpoint
- [ ] Handle loading state
- [ ] Handle empty state (no activities)
- [ ] Display activities in cards
- [ ] Add filters (upcoming, completed, overdue)

**Test Cases**:
1. Student with 5 activities → Shows all 5
2. Student with no activities → Shows empty state
3. Student not in class → Shows appropriate message
4. Activities sorted by due date → Correct order

**Definition of Done**:
- Students see their activities
- Correct activities for their class
- UI responsive and user-friendly
- Tests pass

---

### LSTA-011: Implement Database Migrations with Flyway
**Type**: Task - Infrastructure  
**Priority**: ⚠️ HIGH  
**Story Points**: 5  
**Assignee**: Backend Lead  
**Sprint**: Sprint 1  

**Description**:
No database migration system in place. Schema changes are not versioned, making deployments risky and rollbacks difficult.

**Acceptance Criteria**:
- [ ] Add Flyway dependency
- [ ] Create initial migration from current schema
- [ ] Configure Flyway in application.properties
- [ ] Create migration naming convention
- [ ] Document migration process
- [ ] Test migrations on clean database

**Technical Tasks**:
- [ ] Add to `pom.xml`:
  ```xml
  <dependency>
      <groupId>org.flywaydb</groupId>
      <artifactId>flyway-core</artifactId>
  </dependency>
  ```
- [ ] Configure in `application.properties`:
  ```properties
  spring.flyway.enabled=true
  spring.flyway.locations=classpath:db/migration
  spring.flyway.baseline-on-migrate=true
  ```
- [ ] Create migration folder: `src/main/resources/db/migration`
- [ ] Generate current schema as V1:
  `V1__Initial_Schema.sql`
- [ ] Create future migrations as needed
- [ ] Add to CI/CD pipeline

**Migration Naming**:
```
V{version}__{description}.sql
Examples:
V1__Initial_Schema.sql
V2__Add_Activity_Class_Assignment.sql
V3__Add_Email_Unique_Constraint.sql
```

**Definition of Done**:
- Flyway configured and working
- Initial migration successful
- Documentation complete
- Team trained on migration process

---

### LSTA-012: Add Error Boundaries & User-Friendly Error Messages
**Type**: Task - UX & Stability  
**Priority**: ⚠️ HIGH  
**Story Points**: 3  
**Assignee**: Frontend Developer  
**Sprint**: Sprint 2  

**Description**:
Application crashes on errors, showing technical messages to users. Need error boundaries and user-friendly error handling.

**Acceptance Criteria**:
- [ ] Create Error Boundary component
- [ ] Wrap app sections with error boundaries
- [ ] Transform technical errors to user messages
- [ ] Log errors to monitoring service
- [ ] Add fallback UI for errors
- [ ] Implement retry mechanism

**Technical Tasks**:
- [ ] Create `ErrorBoundary.tsx`:
  ```typescript
  class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };
    
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
      // Log to monitoring service
      console.error(error, errorInfo);
    }
    
    render() {
      if (this.state.hasError) {
        return <ErrorFallback />;
      }
      return this.props.children;
    }
  }
  ```
- [ ] Create error message mapping:
  ```typescript
  const errorMessages = {
    'CONSTRAINT_VIOLATION': 'This record already exists',
    'NOT_FOUND': 'The requested item was not found',
    'UNAUTHORIZED': 'Please log in to continue',
  };
  ```
- [ ] Add error boundaries to major routes
- [ ] Implement toast notifications for errors

**Error Messages to Improve**:
```
❌ "NullPointerException at line 45"
✅ "An error occurred. Please try again."

❌ "Constraint violation: FK_STUDENT_CLASS"
✅ "This student is already in a class."

❌ "Error 500: Internal Server Error"
✅ "Something went wrong. Our team has been notified."
```

**Definition of Done**:
- App doesn't crash on errors
- User-friendly messages shown
- Errors logged for debugging
- Tests cover error scenarios

---

### LSTA-013: Implement Pagination on All List Endpoints
**Type**: Task - Performance  
**Priority**: ⚠️ HIGH  
**Story Points**: 5  
**Assignee**: Backend + Frontend  
**Sprint**: Sprint 2  

**Description**:
All list endpoints return complete datasets, causing performance issues with large schools (1000+ students).

**Acceptance Criteria**:
- [ ] Add pagination to all list endpoints
- [ ] Support page number and page size params
- [ ] Return total count with results
- [ ] Default page size: 20 items
- [ ] Max page size: 100 items
- [ ] Frontend implements pagination UI

**Technical Tasks**:

**Backend**:
- [ ] Update endpoints to accept pagination params:
  ```java
  @GetMapping
  public Page<Student> getStudents(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "id") String sortBy) {
      Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
      return studentService.findAll(pageable);
  }
  ```
- [ ] Return pagination metadata:
  ```json
  {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 500,
    "totalPages": 25
  }
  ```

**Frontend**:
- [ ] Add pagination component
- [ ] Update API calls to include pagination params
- [ ] Implement page navigation
- [ ] Add items-per-page selector
- [ ] Show total count

**Endpoints to Paginate**:
- [ ] GET /api/student
- [ ] GET /api/activity
- [ ] GET /api/classe
- [ ] GET /api/message
- [ ] GET /api/diagnostic-session
- [ ] GET /api/teacher

**Definition of Done**:
- All lists paginated
- Performance improved
- UI shows pagination controls
- Tests pass

---

## ⚠️ HIGH PRIORITY TICKETS (Sprint 2)

### LSTA-014: Fix Activity-Class Assignment System
**Type**: Bug - Critical Feature  
**Priority**: ⚠️ HIGH  
**Story Points**: 5  
**Assignee**: Full-Stack Developer  
**Sprint**: Sprint 2  

**Description**:
Cannot assign activities to classes. Students don't see assigned work.

**Acceptance Criteria**:
- [ ] Create many-to-many relationship between Activity and Class
- [ ] Admin can assign activity to multiple classes
- [ ] Students see only activities for their class
- [ ] Can unassign activities
- [ ] Show assignment status in admin view

**Technical Tasks**:
- [ ] Create junction table:
  ```sql
  CREATE TABLE activity_class_assignments (
      id UUID PRIMARY KEY,
      activity_id UUID REFERENCES activities(id),
      class_id UUID REFERENCES classes(id),
      assigned_date TIMESTAMP,
      assigned_by UUID REFERENCES profiles(id),
      UNIQUE(activity_id, class_id)
  );
  ```
- [ ] Create entity and repository
- [ ] Add assignment endpoint
- [ ] Update student activities query to join assignments
- [ ] Frontend: Add class selector to activity form
- [ ] Show which classes assigned to

**Definition of Done**:
- Activities can be assigned to classes
- Students see correct activities
- Assignment tracked in database

---

### LSTA-015: Implement Diagnostic Session Result Persistence
**Type**: Bug  
**Priority**: ⚠️ HIGH  
**Story Points**: 3  
**Assignee**: Backend Developer  
**Sprint**: Sprint 2  

**Description**:
Diagnostic session results lost on page refresh. Teachers lose assessment data.

**Acceptance Criteria**:
- [ ] Auto-save results every 30 seconds
- [ ] Save on page navigation
- [ ] Support draft state
- [ ] Recover data on refresh
- [ ] Final submission marks as complete

**Technical Tasks**:
- [ ] Create endpoint: `PUT /api/diagnostic-session/{id}/results`
- [ ] Accept partial results
- [ ] Store in database with draft flag
- [ ] Frontend: Implement auto-save with debounce
- [ ] Add save indicator ("Saving...", "Saved")
- [ ] Load draft on component mount

**Definition of Done**:
- Results persist across refreshes
- Auto-save works reliably
- Clear save status shown

---

### LSTA-016: Fix Search & Filter Functionality
**Type**: Bug  
**Priority**: ⚠️ HIGH  
**Story Points**: 3  
**Assignee**: Frontend Developer  
**Sprint**: Sprint 2  

**Description**:
Search and filters on Student/Teacher management pages don't work properly.

**Acceptance Criteria**:
- [ ] Case-insensitive search
- [ ] Search multiple fields (name, email)
- [ ] Debounce search input (300ms)
- [ ] Filter by class, role, status
- [ ] Combine search with filters
- [ ] Clear filters button

**Technical Tasks**:
- [ ] Implement case-insensitive filter:
  ```typescript
  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  ```
- [ ] Add debounce hook
- [ ] Implement filter combination logic
- [ ] Add "Clear All" button
- [ ] Preserve filters in URL params

**Definition of Done**:
- Search works across all fields
- Filters combine correctly
- Performance good (no lag)

---

### LSTA-017: Add Email Validation (Client & Server)
**Type**: Task  
**Priority**: ⚠️ MEDIUM  
**Story Points**: 2  
**Assignee**: Full-Stack Developer  
**Sprint**: Sprint 2  

**Description**:
Weak or missing email validation allows invalid emails in system.

**Acceptance Criteria**:
- [ ] Backend validates email format
- [ ] Check for duplicate emails
- [ ] Frontend shows real-time validation
- [ ] Clear error messages
- [ ] Test with various email formats

**Technical Tasks**:
- [ ] Backend:
  ```java
  @Email(message = "Invalid email format")
  @Column(unique = true)
  private String email;
  ```
- [ ] Frontend:
  ```typescript
  email: z.string()
    .email("Invalid email format")
    .toLowerCase()
  ```
- [ ] Add duplicate check endpoint
- [ ] Show validation errors inline

**Test Cases**:
- `valid@example.com` → ✅
- `invalid@` → ❌
- `not-an-email` → ❌
- Duplicate → ❌

**Definition of Done**:
- Only valid emails accepted
- Duplicates prevented
- Clear error messages

---

### LSTA-018: Enforce Password Strength Requirements
**Type**: Task - Security  
**Priority**: ⚠️ MEDIUM  
**Story Points**: 2  
**Assignee**: Full-Stack Developer  
**Sprint**: Sprint 2  

**Description**:
Weak passwords allowed, creating security risk.

**Acceptance Criteria**:
- [ ] Minimum 8 characters
- [ ] At least 1 uppercase letter
- [ ] At least 1 lowercase letter
- [ ] At least 1 number
- [ ] At least 1 special character
- [ ] Password confirmation field
- [ ] Show strength indicator
- [ ] Prevent common passwords

**Technical Tasks**:
- [ ] Backend validation:
  ```java
  @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$")
  private String password;
  ```
- [ ] Frontend:
  ```typescript
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/\d/, "Must contain number")
    .regex(/[@$!%*?&]/, "Must contain special character")
  ```
- [ ] Add password strength meter
- [ ] Common password blocklist

**Definition of Done**:
- Strong passwords required
- Strength indicator shown
- Tests pass

---

### LSTA-019: Add Teacher Session Edit/Delete Functionality
**Type**: Bug  
**Priority**: ⚠️ MEDIUM  
**Story Points**: 3  
**Assignee**: Full-Stack Developer  
**Sprint**: Sprint 2  

**Description**:
Teachers cannot edit or delete sessions after creation.

**Acceptance Criteria**:
- [ ] Add edit button to sessions
- [ ] Populate form with existing data
- [ ] Update session via API
- [ ] Add delete button with confirmation
- [ ] Only allow editing own sessions
- [ ] Update UI after save/delete

**Technical Tasks**:
- [ ] Frontend: Add edit/delete buttons
- [ ] Create edit modal/page
- [ ] Implement API calls (PUT/DELETE)
- [ ] Add confirmation dialog for delete
- [ ] Backend: Verify ownership before edit/delete
- [ ] Test edge cases

**Definition of Done**:
- Can edit sessions
- Can delete sessions
- Ownership verified
- Smooth UX

---

### LSTA-020: Implement File Size Limits & Validation
**Type**: Task - Security & Performance  
**Priority**: ⚠️ MEDIUM  
**Story Points**: 2  
**Assignee**: Backend Developer  
**Sprint**: Sprint 2  

**Description**:
No file size limits allow uploads of huge files, risking server crashes and storage issues.

**Acceptance Criteria**:
- [ ] Max file size: 10MB per file
- [ ] Validate file types (PDF, images, docs)
- [ ] Clear error message on rejection
- [ ] Show file size before upload
- [ ] Configure in application.properties

**Technical Tasks**:
- [ ] Add to `application.properties`:
  ```properties
  spring.servlet.multipart.max-file-size=10MB
  spring.servlet.multipart.max-request-size=10MB
  ```
- [ ] Validate file type in controller
- [ ] Frontend: Check size before upload
- [ ] Show file size in upload UI
- [ ] Handle error gracefully

**Allowed File Types**:
- PDF: `.pdf`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Documents: `.doc`, `.docx`, `.txt`

**Definition of Done**:
- Files over 10MB rejected
- Clear error messages
- Only allowed types accepted

---

### LSTA-021: Fix Timezone Handling for Dates
**Type**: Bug  
**Priority**: ⚠️ MEDIUM  
**Story Points**: 3  
**Assignee**: Full-Stack Developer  
**Sprint**: Sprint 2  

**Description**:
Dates display incorrectly due to timezone conversion issues.

**Acceptance Criteria**:
- [ ] Store dates in UTC in database
- [ ] Convert to user's timezone for display
- [ ] Show timezone indicator
- [ ] Consistent date formatting
- [ ] Handle DST correctly

**Technical Tasks**:
- [ ] Backend: Use `Instant` or `ZonedDateTime`
- [ ] Always store in UTC
- [ ] Frontend: Use date-fns or dayjs with timezone
- [ ] Add timezone selector to user profile
- [ ] Display timezone in date labels

**Example**:
```typescript
import { formatInTimeZone } from 'date-fns-tz';

const formatted = formatInTimeZone(
  date,
  userTimeZone,
  'yyyy-MM-dd HH:mm zzz'
);
// Output: "2025-10-26 14:30 PST"
```

**Definition of Done**:
- Dates consistent across timezones
- Timezone shown clearly
- No off-by-one-day errors

---

### LSTA-022: Implement Form Draft Saving
**Type**: Task - UX  
**Priority**: ⚠️ MEDIUM  
**Story Points**: 3  
**Assignee**: Frontend Developer  
**Sprint**: Sprint 2  

**Description**:
Form data lost when submission fails or page refreshes.

**Acceptance Criteria**:
- [ ] Auto-save form data to localStorage
- [ ] Restore data on page load
- [ ] Clear draft after successful submit
- [ ] Show draft indicator
- [ ] Option to discard draft

**Technical Tasks**:
- [ ] Create useDraftForm hook:
  ```typescript
  const useDraftForm = (formKey: string) => {
    // Save to localStorage on change
    // Load from localStorage on mount
    // Clear on submit
  };
  ```
- [ ] Apply to long forms:
  - Activity creation
  - Student creation
  - Class creation
- [ ] Add "Draft saved" indicator
- [ ] Add "Discard draft" button

**Definition of Done**:
- Forms preserve data on error
- Drafts recoverable
- Clear visual feedback

---

### LSTA-023: Add Mobile Responsive Design Fixes
**Type**: Bug - UX  
**Priority**: ⚠️ MEDIUM  
**Story Points**: 5  
**Assignee**: Frontend Developer  
**Sprint**: Sprint 3  

**Description**:
UI broken on mobile devices and tablets.

**Acceptance Criteria**:
- [ ] Tables scroll horizontally on mobile
- [ ] Forms fit on small screens
- [ ] Buttons don't overlap text
- [ ] Navigation menu collapses
- [ ] Touch targets minimum 44x44px
- [ ] Test on multiple screen sizes

**Screen Sizes to Test**:
- Mobile: 375px (iPhone SE)
- Mobile: 390px (iPhone 12)
- Tablet: 768px (iPad)
- Desktop: 1024px+

**Technical Tasks**:
- [ ] Make tables responsive:
  ```tsx
  <div className="overflow-x-auto">
    <table>...</table>
  </div>
  ```
- [ ] Use responsive Tailwind classes
- [ ] Add mobile navigation
- [ ] Test on real devices
- [ ] Fix form layouts for mobile

**Definition of Done**:
- App usable on mobile
- No horizontal scroll
- All features accessible

---

## 🟡 MEDIUM/LOW PRIORITY TICKETS (Backlog)

### LSTA-024: Add Download Button for Files
**Type**: Feature  
**Priority**: 🟡 MEDIUM  
**Story Points**: 2  
**Sprint**: Backlog  

**Description**: Add download button for uploaded files

**Tasks**:
- [ ] Add download button to file viewer
- [ ] Set correct Content-Disposition header
- [ ] Track download statistics
- [ ] Add download icon and tooltip

---

### LSTA-025: Implement Notification System
**Type**: Feature  
**Priority**: 🟡 LOW  
**Story Points**: 8  
**Sprint**: Backlog  

**Description**: Real-time notifications for users

**Tasks**:
- [ ] Design notification data model
- [ ] Create notification endpoints
- [ ] Add notification bell icon
- [ ] Implement WebSocket for real-time
- [ ] Add notification preferences

---

### LSTA-026: Add Profile Picture Upload
**Type**: Feature  
**Priority**: 🟡 LOW  
**Story Points**: 3  
**Sprint**: Backlog  

**Tasks**:
- [ ] Add avatar upload to profile
- [ ] Resize images server-side
- [ ] Display avatars throughout app
- [ ] Allow avatar deletion

---

### LSTA-027: Implement Activity Cloning Feature
**Type**: Feature  
**Priority**: 🟡 LOW  
**Story Points**: 2  
**Sprint**: Backlog  

**Tasks**:
- [ ] Add "Duplicate" button to activities
- [ ] Clone activity with new ID
- [ ] Allow editing cloned activity
- [ ] Copy file attachments

---

### LSTA-028: Add Bulk Operations (Delete/Edit)
**Type**: Feature  
**Priority**: 🟡 LOW  
**Story Points**: 5  
**Sprint**: Backlog  

**Tasks**:
- [ ] Add checkbox selection
- [ ] Bulk delete endpoint
- [ ] Bulk edit endpoint
- [ ] Confirmation dialog
- [ ] Progress indicator

---

### LSTA-029: Implement Excel Export
**Type**: Feature  
**Priority**: 🟡 LOW  
**Story Points**: 3  
**Sprint**: Backlog  

**Tasks**:
- [ ] Add Apache POI dependency
- [ ] Create Excel export service
- [ ] Add export buttons
- [ ] Support student/teacher exports
- [ ] Include filters in export

---

### LSTA-030: Implement Dark Mode
**Type**: Feature  
**Priority**: 🟡 LOW  
**Story Points**: 3  
**Sprint**: Backlog  

**Tasks**:
- [ ] Add theme toggle
- [ ] Define dark mode colors
- [ ] Update all components
- [ ] Persist preference
- [ ] Test accessibility

---

### LSTA-031: Add Keyboard Shortcuts
**Type**: Feature  
**Priority**: 🟡 LOW  
**Story Points**: 2  
**Sprint**: Backlog  

**Tasks**:
- [ ] Define keyboard shortcuts
- [ ] Implement shortcut handler
- [ ] Add shortcuts modal (? key)
- [ ] Document shortcuts
- [ ] Test cross-browser

---

## 📈 SPRINT BREAKDOWN RECOMMENDATION

### **Sprint 1** (2 weeks) - Critical Security & Core Functions
**Goal**: Make application secure and core features functional

**Tickets**: LSTA-001 to LSTA-011  
**Story Points**: 55  
**Focus**: Security, Authentication, File Upload, Core Bugs

**Must Complete**:
- ✅ JWT Authentication (LSTA-001)
- ✅ File Upload Fix (LSTA-002)
- ✅ Route Guards (LSTA-003)
- ✅ RBAC (LSTA-004)
- ✅ Change Default Credentials (LSTA-005)

---

### **Sprint 2** (2 weeks) - User Experience & Features
**Goal**: Improve UX and complete critical features

**Tickets**: LSTA-012 to LSTA-023  
**Story Points**: 34  
**Focus**: Pagination, Error Handling, Student Features

**Must Complete**:
- ✅ Activity Assignment (LSTA-014)
- ✅ Student Dashboard (LSTA-010)
- ✅ Pagination (LSTA-013)
- ✅ Error Boundaries (LSTA-012)

---

### **Sprint 3** (2 weeks) - Polish & Enhancement
**Goal**: Polish and prepare for production

**Tickets**: LSTA-024 to LSTA-031  
**Story Points**: Backlog items  
**Focus**: Nice-to-have features, optimization

---

## 🎯 SPRINT GOALS & METRICS

### Sprint 1 Success Criteria:
- [ ] All authentication tests pass
- [ ] Zero unauthorized access possible
- [ ] Files upload and download successfully
- [ ] No default credentials in use
- [ ] Student dashboard loads activities

### Sprint 2 Success Criteria:
- [ ] All list pages paginated
- [ ] No technical errors shown to users
- [ ] Teachers can manage sessions fully
- [ ] Search works on all pages
- [ ] Mobile UI functional

### Production Readiness Criteria:
- [ ] All critical (🔴) tickets closed
- [ ] Security audit passed
- [ ] Load testing completed (500 concurrent users)
- [ ] UAT completed with 5+ schools
- [ ] Documentation complete
- [ ] Monitoring/alerting configured

---

## 📊 VELOCITY & CAPACITY PLANNING

**Team Composition**:
- 2 Backend Developers
- 2 Frontend Developers
- 1 Full-Stack Developer
- 1 QA Engineer

**Estimated Velocity**: 40-45 SP/sprint

**Sprint 1**: 55 SP (Overloaded - need focus)  
**Sprint 2**: 34 SP (Achievable)  
**Sprint 3**: Backlog (Flexible)

**Recommendation**: Sprint 1 is overloaded. Consider:
- Extend to 3 weeks
- Add resources
- Move LSTA-011 (Flyway) to Sprint 2

---

## 🏷️ TICKET LABELS

- `security` - Security vulnerability
- `bug` - Something broken
- `feature` - New functionality
- `performance` - Performance improvement
- `ux` - User experience
- `frontend` - Frontend work
- `backend` - Backend work
- `database` - Database work
- `documentation` - Documentation needed
- `testing` - Test coverage needed

---

## 📞 CONTACT & ESCALATION

**Product Owner**: [Name]  
**Scrum Master**: [Name]  
**Technical Lead**: [Name]  

**Daily Standup**: 9:00 AM  
**Sprint Planning**: First Monday of sprint  
**Sprint Review**: Last Friday of sprint  
**Retrospective**: After sprint review

---

**Report Generated**: October 26, 2025  
**Next Sprint Planning**: [Date]  
**Sprint Start**: [Date]

---

*This JIRA ticket report is based on comprehensive audit and malfunction analysis. All estimates are preliminary and should be refined during sprint planning.*
