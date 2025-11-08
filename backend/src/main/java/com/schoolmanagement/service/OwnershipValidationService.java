package com.schoolmanagement.service;

import com.schoolmanagement.entity.*;
import com.schoolmanagement.repository.*;
import com.schoolmanagement.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

/**
 * Service for validating user ownership and access rights to resources.
 * Ensures users can only access data from their own school/organization.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OwnershipValidationService {

    private final ProfileRepository profileRepository;
    private final ClasseRepository classeRepository;
    private final TeachingSessionRepository teachingSessionRepository;
    private final DiagnosticSessionRepository diagnosticSessionRepository;
    private final JwtUtil jwtUtil;

    /**
     * Validates that a teacher belongs to the specified school.
     * SUPERADMIN can access all schools.
     * ADMIN/TEACHER can only access their own school.
     */
    public void validateTeacherSchoolAccess(UUID teacherId, String requestedSchoolId, Authentication auth) {
        if (auth == null) {
            throw new AccessDeniedException("Authentication required");
        }

        // SUPERADMIN can access all schools
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"))) {
            return;
        }

        // Get teacher's profile
        Profile teacher = profileRepository.findById(teacherId)
                .orElseThrow(() -> new AccessDeniedException("Teacher not found"));

        // Validate school matches
        if (!teacher.getSchoolId().equals(requestedSchoolId)) {
            throw new AccessDeniedException("Teacher does not belong to the specified school");
        }

        // For ADMIN/TEACHER: validate they are accessing their own school
        UUID currentUserId = extractUserIdFromAuth(auth);
        if (currentUserId != null) {
            Profile currentUser = profileRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && !currentUser.getSchoolId().equals(requestedSchoolId)) {
                throw new AccessDeniedException("Cannot access resources from another school");
            }
        }
    }

    /**
     * Validates that a class belongs to the specified school.
     */
    public void validateClassSchoolAccess(UUID classId, String requestedSchoolId, Authentication auth) {
        if (auth == null) {
            throw new AccessDeniedException("Authentication required");
        }

        // SUPERADMIN can access all schools
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"))) {
            return;
        }

        // Get class
        Classe classe = classeRepository.findById(classId)
                .orElseThrow(() -> new AccessDeniedException("Class not found"));

        // Validate school matches
        if (!classe.getSchoolId().equals(requestedSchoolId)) {
            throw new AccessDeniedException("Class does not belong to the specified school");
        }

        // For ADMIN/TEACHER: validate they are accessing their own school
        UUID currentUserId = extractUserIdFromAuth(auth);
        if (currentUserId != null) {
            Profile currentUser = profileRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && !currentUser.getSchoolId().equals(requestedSchoolId)) {
                throw new AccessDeniedException("Cannot access resources from another school");
            }
        }
    }

    /**
     * Validates that a session belongs to the user's school.
     */
    public void validateSessionAccess(UUID sessionId, Authentication auth) {
        if (auth == null) {
            throw new AccessDeniedException("Authentication required");
        }

        // SUPERADMIN can access all sessions
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"))) {
            return;
        }

        TeachingSession session = teachingSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AccessDeniedException("Session not found"));

        UUID currentUserId = extractUserIdFromAuth(auth);
        if (currentUserId != null) {
            Profile currentUser = profileRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && !currentUser.getSchoolId().equals(session.getSchoolId())) {
                throw new AccessDeniedException("Cannot access sessions from another school");
            }
        }
    }

    /**
     * Validates that a diagnostic session belongs to the user's school.
     */
    public void validateDiagnosticSessionAccess(UUID sessionId, Authentication auth) {
        if (auth == null) {
            throw new AccessDeniedException("Authentication required");
        }

        // SUPERADMIN can access all sessions
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"))) {
            return;
        }

        DiagnosticSession session = diagnosticSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AccessDeniedException("Diagnostic session not found"));

        UUID currentUserId = extractUserIdFromAuth(auth);
        if (currentUserId != null) {
            Profile currentUser = profileRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && !currentUser.getSchoolId().equals(session.getSchoolId())) {
                throw new AccessDeniedException("Cannot access diagnostic sessions from another school");
            }
        }
    }

    /**
     * Validates that a user can only access data from their own school.
     * Used for filtering lists by schoolId.
     */
    public void validateSchoolAccess(Long schoolId, Authentication auth) {
        if (auth == null) {
            log.warn("❌ Access denied: No authentication provided for school access");
            throw new AccessDeniedException("Authentication required");
        }

        // SUPERADMIN can access all schools
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"))) {
            log.debug("✅ SUPERADMIN accessing school: {}", schoolId);
            return;
        }

        UUID currentUserId = extractUserIdFromAuth(auth);
        if (currentUserId != null) {
            Profile currentUser = profileRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && !currentUser.getSchoolId().equals(schoolId)) {
                log.warn("❌ Access denied: User {} (school: {}) attempted to access school: {}", 
                        currentUserId, currentUser.getSchoolId(), schoolId);
                throw new AccessDeniedException("Cannot access data from another school");
            }
            log.debug("✅ User {} authorized to access school: {}", currentUserId, schoolId);
        }
    }

    /**
     * Extract user ID from Authentication object.
     * Uses the UserAuthenticationDetails stored during JWT filter processing.
     * 
     * @param auth Spring Security Authentication object
     * @return User UUID
     * @throws AccessDeniedException if userId cannot be extracted
     */
    private UUID extractUserIdFromAuth(Authentication auth) {
        try {
            // Check if authentication details contain UserAuthenticationDetails
            Object details = auth.getDetails();
            
            if (details instanceof com.schoolmanagement.security.UserAuthenticationDetails) {
                com.schoolmanagement.security.UserAuthenticationDetails userDetails = 
                    (com.schoolmanagement.security.UserAuthenticationDetails) details;
                return userDetails.getUserId();
            }
            
            // Fallback: extract from JWT token in header (for requests not going through JWT filter)
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                throw new AccessDeniedException("No request context available");
            }
            
            HttpServletRequest request = attributes.getRequest();
            String authHeader = request.getHeader("Authorization");
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new AccessDeniedException("No valid JWT token found");
            }
            
            // Extract JWT token
            String jwt = authHeader.substring(7);
            
            // Extract userId claim from token
            String userIdStr = jwtUtil.extractUserId(jwt);
            
            if (userIdStr == null || userIdStr.isEmpty()) {
                throw new AccessDeniedException("No userId found in token");
            }
            
            return UUID.fromString(userIdStr);
            
        } catch (IllegalArgumentException e) {
            throw new AccessDeniedException("Invalid userId format in token");
        } catch (Exception e) {
            throw new AccessDeniedException("Failed to extract userId from authentication: " + e.getMessage());
        }
    }
}
