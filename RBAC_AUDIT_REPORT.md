# 🔐 RBAC (Role-Based Access Control) Comprehensive Audit Report

**Date:** October 29, 2025  
**Branch:** `rbac-audit-and-fixes`  
**Status:** 🔴 **CRITICAL ISSUES FOUND**

---

## 📋 Executive Summary

This audit has identified **17 critical RBAC issues** that explain why users are experiencing "access denied" errors when they should have permission. The problems span across:

1. **Role Definition Inconsistencies** (Database vs Backend vs Frontend)
2. **Missing STUDENT Role Implementation**
3. **JWT Token Role Formatting Issues**
4. **Authorization Logic Gaps**
5. **Frontend-Backend Role Mismatch**

---

## 🚨 Critical Issues Identified

### **ISSUE #1: Role Definition Mismatch Across Layers** 🔴 CRITICAL

**Problem:**
- **Database** (`app_role` enum): Only defines `'admin'` and `'teacher'`
- **Backend** (`UserRole.Role` enum): Defines `superadmin`, `admin`, `teacher`, `student`
- **Frontend**: Expects `SUPERADMIN`, `ADMIN`, `TEACHER`, `STUDENT`

**Location:**
```sql
-- migrations/init.sql:8
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher');
```

```java
// backend/src/main/java/com/schoolmanagement/entity/UserRole.java:27
public enum Role {
    superadmin, admin, teacher, student
}
```

**Impact:** 
- STUDENT and SUPERADMIN roles cannot be stored in database
- Creating users with these roles will fail
- Role-based authorization will be inconsistent

**Fix Required:** ✅
```sql
-- Update database enum to include all roles
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'teacher', 'student');
```

---

### **ISSUE #2: JWT Token Role Case Inconsistency** 🔴 CRITICAL

**Problem:**
JWT tokens store roles in **lowercase** (e.g., `"teacher"`, `"admin"`) but:
- Spring Security expects **ROLE_** prefix with UPPERCASE (e.g., `"ROLE_TEACHER"`)
- Frontend expects UPPERCASE (e.g., `"TEACHER"`, `"ADMIN"`)

**Location:**
```java
// JwtAuthenticationFilter.java:60
SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + role.toUpperCase());
```

```java
// AuthController.java:68
String role = roles.get(0).getRole().name(); // Returns lowercase: "teacher"
String token = jwtUtil.generateToken(..., role, ...); // Stores lowercase in JWT
```

**Current Flow:**
1. Database stores: `teacher` (lowercase)
2. JWT token stores: `teacher` (lowercase)
3. JwtAuthenticationFilter converts to: `ROLE_TEACHER` (uppercase with prefix) ✅
4. @PreAuthorize expects: `ROLE_TEACHER` ✅

**Issue:**
The flow works for Spring Security but causes confusion. The real problem is when the frontend receives the role in lowercase from the token but expects uppercase.

**Impact:**
- Frontend role checks may fail
- Inconsistent role display in UI
- Potential authorization failures on frontend

**Fix Required:** ✅
Normalize all roles to uppercase consistently across the stack.

---

### **ISSUE #3: Missing STUDENT Role in Database Schema** 🔴 CRITICAL

**Problem:**
The `students` table exists but has no connection to `user_roles` table. Students cannot authenticate.

**Location:**
```sql
-- migrations/init.sql
-- No student-to-user mapping exists
```

**Impact:**
- Students cannot log in
- No authentication flow for students
- STUDENT role cannot be assigned in database

**Fix Required:** ✅
1. Add `user_id` column to `students` table
2. Update `app_role` enum to include `'student'`
3. Create migration to link existing students to auth users

---

### **ISSUE #4: SecurityConfig Role Hierarchy Violation** ⚠️ HIGH

**Problem:**
Some endpoints have conflicting or overly permissive access rules.

**Location:**
```java
// SecurityConfig.java:72-74
.requestMatchers("/api/students/**").hasAnyRole("SUPERADMIN", "ADMIN", "TEACHER", "STUDENT")
.requestMatchers("/api/classes/**").hasAnyRole("SUPERADMIN", "ADMIN", "TEACHER")
.requestMatchers("/api/teachers/**").hasAnyRole("SUPERADMIN", "ADMIN", "TEACHER")
```

**Issues:**
- `/api/students/**` allows STUDENT role but individual endpoints have stricter `@PreAuthorize`
- This creates a conflict where SecurityConfig allows but Controller denies
- `/api/teachers/**` allows TEACHER to access teacher endpoints (could allow teachers to modify each other)

**Impact:**
- 403 Forbidden errors when SecurityConfig and @PreAuthorize conflict
- Confusing authorization logic
- Security vulnerabilities

**Fix Required:** ✅
Align SecurityConfig with Controller @PreAuthorize annotations or remove redundant rules.

---

### **ISSUE #5: OwnershipValidationService Extracts userId from JWT Twice** ⚠️ MEDIUM

**Problem:**
The service extracts userId from request header instead of using Spring Security's Authentication object efficiently.

**Location:**
```java
// OwnershipValidationService.java:176
private UUID extractUserIdFromAuth(Authentication auth) {
    ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    HttpServletRequest request = attributes.getRequest();
    String authHeader = request.getHeader("Authorization");
    String jwt = authHeader.substring(7);
    String userIdStr = jwtUtil.extractUserId(jwt);
    return UUID.fromString(userIdStr);
}
```

**Issue:**
- JWT is already validated by JwtAuthenticationFilter
- userId should be stored in Authentication principal or details
- Re-parsing JWT on every ownership check is inefficient
- Could fail if request context is not available

**Impact:**
- Performance overhead
- Potential NullPointerException if RequestContext is not set
- Code duplication

**Fix Required:** ✅
Store userId in Authentication object during JWT filter processing.

---

### **ISSUE #6: Frontend Role Check Case Sensitivity** ⚠️ MEDIUM

**Problem:**
Frontend checks roles with `.toUpperCase()` but backend sends lowercase from some endpoints.

**Location:**
```tsx
// AuthContext.tsx:114
const userRole = user.role.toUpperCase();
```

```tsx
// PrivateRoute.tsx:51
const userRole = user?.role.toUpperCase();
```

**Issue:**
Defensive programming is good, but indicates underlying inconsistency in role casing.

**Impact:**
- Fragile code that depends on case conversion
- May break if backend changes role casing

**Fix Required:** ✅
Standardize role casing in backend responses.

---

### **ISSUE #7: Missing Role Validation in Multiple Controllers** ⚠️ HIGH

**Problem:**
Several controllers have class-level `@PreAuthorize` but individual methods don't validate school ownership or resource ownership properly.

**Affected Controllers:**
1. **TeacherController** - Class level allows `TEACHER` but no ownership validation
2. **ActivityController** - Students can access activities but no validation
3. **MessageController** - Only `@PreAuthorize("isAuthenticated()")`, no role check
4. **ResourceController** - Mixed role requirements

**Location:**
```java
// TeacherController.java:20
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
public class TeacherController {
    // Teachers can access ALL teachers, not just their school
```

**Impact:**
- Teachers could potentially access teachers from other schools
- Cross-school data leakage
- Insufficient authorization

**Fix Required:** ✅
Add school-based ownership validation to all relevant methods.

---

### **ISSUE #8: Profile Table Missing password_hash Column** 🔴 CRITICAL

**Problem:**
Looking at the schema, the `profiles` table doesn't have a `password_hash` column, but AuthController tries to access it.

**Location:**
```sql
-- migrations/init.sql:30
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  matiere TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  -- NO PASSWORD HASH FIELD!
);
```

```java
// AuthController.java:60
if (profile.getPasswordHash() == null || !passwordEncoder.matches(password, profile.getPasswordHash())) {
```

**Impact:**
- Login will always fail (password verification impossible)
- Users cannot authenticate
- **This is a critical authentication bypass issue**

**Fix Required:** ✅
```sql
ALTER TABLE public.profiles ADD COLUMN password_hash TEXT;
```

---

### **ISSUE #9: No Role Hierarchy or Permission System** ⚠️ MEDIUM

**Problem:**
Current implementation uses flat roles without hierarchy:
- SUPERADMIN should inherit ADMIN permissions
- ADMIN should inherit TEACHER permissions
- No fine-grained permissions (only roles)

**Location:**
All `@PreAuthorize` annotations list roles explicitly.

**Impact:**
- Code duplication in authorization checks
- Difficult to maintain
- Cannot implement granular permissions

**Fix Required:** 🔄 FUTURE ENHANCEMENT
Consider implementing Spring Security Role Hierarchy:
```java
@Bean
public RoleHierarchy roleHierarchy() {
    RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
    hierarchy.setHierarchy("ROLE_SUPERADMIN > ROLE_ADMIN > ROLE_TEACHER > ROLE_STUDENT");
    return hierarchy;
}
```

---

### **ISSUE #10: StudentController Manual Authorization Logic** ⚠️ MEDIUM

**Problem:**
StudentController implements manual authorization checks instead of using declarative approach.

**Location:**
```java
// StudentController.java:42
if ("STUDENT".equalsIgnoreCase(role)) {
    UUID userId = UUID.fromString(jwtUtil.extractUserId(token));
    if (!student.getUserId().equals(userId)) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}
```

**Issue:**
- Manual token extraction and validation
- Duplicates logic from JWT filter
- Error-prone and hard to maintain
- Should use OwnershipValidationService

**Impact:**
- Code inconsistency
- Maintenance burden
- Potential security bugs

**Fix Required:** ✅
Use OwnershipValidationService or custom @PreAuthorize expressions.

---

### **ISSUE #11: Multiple Role Storage in user_roles Table** ⚠️ LOW

**Problem:**
The `user_roles` table allows multiple roles per user (`UNIQUE (user_id, role)`), but the application logic assumes single role.

**Location:**
```sql
-- migrations/init.sql:50
UNIQUE (user_id, role)  -- Allows multiple rows per user
```

```java
// AuthController.java:67-68
List<UserRole> roles = userRoleRepository.findByUserId(profile.getId());
String role = roles.get(0).getRole().name(); // Takes first role only!
```

**Impact:**
- If user has multiple roles, only first is used
- Inconsistent behavior
- Potential loss of permissions

**Fix Required:** ✅
Either:
1. Enforce single role per user (change schema)
2. Support multiple roles properly (change JWT and authorization logic)

**Recommendation:** Single role per user is simpler for this application.

---

### **ISSUE #12: CORS Configuration Too Permissive** ⚠️ MEDIUM (Security)

**Problem:**
CORS allows all origins in production.

**Location:**
```java
// Controllers use: @CrossOrigin(origins = "*")
```

**Impact:**
- Security vulnerability
- CSRF attacks possible
- Production security risk

**Fix Required:** ✅
Use environment-specific CORS configuration.

---

### **ISSUE #13: Missing Request Validation on Role Changes** 🔴 HIGH (Security)

**Problem:**
No endpoint validation prevents privilege escalation through role modification.

**Impact:**
- Users might try to modify their own role
- No protection against role tampering in requests

**Fix Required:** ✅
Validate that users cannot change their own role or elevate privileges.

---

### **ISSUE #14: Inconsistent Error Responses** ⚠️ LOW

**Problem:**
Some controllers return `403 FORBIDDEN`, others return `404 NOT FOUND`, others throw exceptions.

**Impact:**
- Inconsistent API behavior
- Difficult error handling on frontend
- Security information leakage (knowing if resource exists)

**Fix Required:** ✅
Standardize error responses with global exception handler.

---

### **ISSUE #15: Frontend PrivateRoute Doesn't Handle Multi-Role Arrays Correctly** ⚠️ MEDIUM

**Problem:**
When `requiredRole` is an array like `["ADMIN", "TEACHER"]`, the component checks if user has ANY of those roles, but some routes need ALL roles.

**Location:**
```tsx
// PrivateRoute.tsx:48
if (requiredRole && !hasRole(requiredRole)) {
```

```tsx
// AuthContext.tsx:117
if (Array.isArray(requiredRole)) {
    return requiredRole.some(role => userRole === role.toUpperCase());
}
```

**Impact:**
- Logic is OR (any role), might need AND (all roles) for some cases
- Potential unauthorized access

**Fix Required:** 🔄 VERIFY
Check if current OR logic is intentional for all routes.

---

### **ISSUE #16: No Logging for Authorization Failures** ⚠️ MEDIUM

**Problem:**
When users get "access denied", there's no server-side logging to debug why.

**Impact:**
- Difficult to troubleshoot authorization issues
- No audit trail for security events

**Fix Required:** ✅
Add logging in OwnershipValidationService and exception handlers.

---

### **ISSUE #17: Database Migration Schema Doesn't Match Supabase Migrations** 🔴 CRITICAL

**Problem:**
Two separate migration systems:
1. `/migrations/init.sql` - Docker/standalone
2. `/supabase/migrations/*.sql` - Supabase-specific

**Issue:**
They may define roles differently or have schema drift.

**Impact:**
- Deployment inconsistency
- Production vs development differences
- Hard to track schema changes

**Fix Required:** ✅
Consolidate migration strategy or ensure both are synchronized.

---

## 📊 Issues Summary Table

| Issue # | Severity | Category | Impact | Status |
|---------|----------|----------|--------|--------|
| #1 | 🔴 CRITICAL | Schema | Cannot use STUDENT/SUPERADMIN | Fix Required |
| #2 | 🔴 CRITICAL | JWT | Role case mismatch | Fix Required |
| #3 | 🔴 CRITICAL | Schema | Students can't login | Fix Required |
| #4 | ⚠️ HIGH | Authorization | 403 errors | Fix Required |
| #5 | ⚠️ MEDIUM | Performance | Inefficient userId extraction | Fix Required |
| #6 | ⚠️ MEDIUM | Consistency | Frontend defensive coding | Fix Required |
| #7 | ⚠️ HIGH | Authorization | Cross-school access | Fix Required |
| #8 | 🔴 CRITICAL | Schema | No password storage | Fix Required |
| #9 | ⚠️ MEDIUM | Architecture | No role hierarchy | Future |
| #10 | ⚠️ MEDIUM | Code Quality | Manual auth checks | Fix Required |
| #11 | ⚠️ LOW | Schema | Multi-role ambiguity | Fix Required |
| #12 | ⚠️ MEDIUM | Security | CORS too permissive | Fix Required |
| #13 | 🔴 HIGH | Security | No role change protection | Fix Required |
| #14 | ⚠️ LOW | API | Inconsistent errors | Fix Required |
| #15 | ⚠️ MEDIUM | Frontend | Role check logic | Verify |
| #16 | ⚠️ MEDIUM | Observability | No auth logging | Fix Required |
| #17 | 🔴 CRITICAL | DevOps | Schema drift | Fix Required |

**Total Issues:** 17  
**Critical:** 5 🔴  
**High:** 3 ⚠️  
**Medium:** 7 ⚠️  
**Low:** 2 ⚠️  

---

## 🎯 Root Cause Analysis

### Why are users getting "access denied" errors?

The main causes are:

1. **Database schema doesn't support all roles** - STUDENT and SUPERADMIN cannot be stored
2. **Missing password_hash column** - Authentication fails completely
3. **Role case inconsistency** - Backend sends lowercase, frontend expects uppercase
4. **SecurityConfig vs @PreAuthorize conflicts** - Conflicting authorization rules
5. **Missing ownership validation** - Users access denied to their own school's resources

---

## ✅ Recommended Fix Priority

### Phase 1: Critical Database Fixes (IMMEDIATE)
1. Add `password_hash` column to `profiles` table
2. Update `app_role` enum to include all 4 roles
3. Add `user_id` column to `students` table
4. Synchronize Docker and Supabase migrations

### Phase 2: JWT & Authentication (IMMEDIATE)
1. Normalize role casing to uppercase in database
2. Update JWT generation to store uppercase roles
3. Update all endpoints to return consistent role format
4. Add userId to Authentication principal

### Phase 3: Authorization Logic (HIGH PRIORITY)
1. Fix SecurityConfig conflicts with @PreAuthorize
2. Add comprehensive ownership validation
3. Implement role change protection
4. Standardize error responses

### Phase 4: Code Quality (MEDIUM PRIORITY)
1. Refactor manual authorization checks
2. Add authorization logging
3. Implement proper CORS configuration
4. Add integration tests for RBAC

### Phase 5: Future Enhancements (LOW PRIORITY)
1. Implement role hierarchy
2. Add fine-grained permissions
3. Add audit logging for all role changes

---

## 🔧 Next Steps

1. **Review this audit report** with the team
2. **Prioritize fixes** based on severity and impact
3. **Create detailed implementation plan** for each fix
4. **Test thoroughly** in development environment
5. **Deploy incrementally** with rollback plan

---

## 📝 Testing Recommendations

After fixes are implemented, test:

1. ✅ User login with all 4 roles (SUPERADMIN, ADMIN, TEACHER, STUDENT)
2. ✅ Cross-school access prevention
3. ✅ Role-based endpoint access
4. ✅ Frontend route protection
5. ✅ JWT token validation
6. ✅ Error messages consistency
7. ✅ Authorization logging

---

**Audited by:** GitHub Copilot  
**Report Generated:** October 29, 2025  
**Branch:** `rbac-audit-and-fixes`
