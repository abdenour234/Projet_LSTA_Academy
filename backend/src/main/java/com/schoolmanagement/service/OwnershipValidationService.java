package com.schoolmanagement.service;

import com.schoolmanagement.entity.*;
import com.schoolmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service for validating user ownership and access rights to resources.
 * Ensures users can only access data from their own school/organization.
 */
@Service
@RequiredArgsConstructor
public class OwnershipValidationService {

    private final ProfileRepository profileRepository;
    private final ClasseRepository classeRepository;
    private final TeachingSessionRepository teachingSessionRepository;
    private final DiagnosticSessionRepository diagnosticSessionRepository;
    private final UserRoleRepository userRoleRepository;

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
    public void validateSchoolAccess(String schoolId, Authentication auth) {
        if (auth == null) {
            throw new AccessDeniedException("Authentication required");
        }

        // SUPERADMIN can access all schools
        if (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_SUPERADMIN"))) {
            return;
        }

        UUID currentUserId = extractUserIdFromAuth(auth);
        if (currentUserId != null) {
            Profile currentUser = profileRepository.findById(currentUserId).orElse(null);
            if (currentUser != null && !currentUser.getSchoolId().equals(schoolId)) {
                throw new AccessDeniedException("Cannot access data from another school");
            }
        }
    }

    /**
     * Extract user ID from Authentication object.
     * TODO: Implement proper JWT claim extraction
     * Currently returns null - needs to be implemented with JWT token parsing.
     */
    private UUID extractUserIdFromAuth(Authentication auth) {
        if (auth == null || auth.getPrincipal() == null) {
            return null;
        }

        // TODO: Extract userId from JWT claims
        // This should parse the JWT token and extract the user ID claim
        // For now, returning null to avoid breaking existing functionality
        // Implementation needed: Parse auth.getPrincipal() to get JWT userId claim
        
        return null;
    }
}
