package com.schoolmanagement.security;

import com.schoolmanagement.entity.*;
import com.schoolmanagement.repository.*;
import com.schoolmanagement.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service for validating resource ownership and access rights.
 * Ensures users can only access/modify resources they own or have permission for.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ResourceOwnershipValidator {

    private final JwtUtil jwtUtil;
    private final StudentRepository studentRepository;
    private final ActivityRepository activityRepository;
    private final MessageRepository messageRepository;
    private final ResourceRepository resourceRepository;
    private final ClasseRepository classeRepository;

    /**
     * Extract user information from JWT token
     */
    public UserContext extractUserContext(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.replace("Bearer ", "");
        String userId = jwtUtil.extractUserId(token);
        String role = jwtUtil.extractRole(token);
        String schoolId = jwtUtil.extractSchoolId(token);
        
        return new UserContext(UUID.fromString(userId), role, schoolId);
    }

    /**
     * Check if user can access student data
     */
    public boolean canAccessStudent(UserContext user, UUID studentId) {
        if (user == null) return false;
        
        // SuperAdmin can access all
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return false;
        
        // Student can only access their own data
        if ("STUDENT".equalsIgnoreCase(user.role)) {
            return student.getUserId() != null && student.getUserId().equals(user.userId);
        }
        
        // Admin/Teacher can access students in their school
        if ("ADMIN".equalsIgnoreCase(user.role) || "TEACHER".equalsIgnoreCase(user.role)) {
            // Convert Long schoolId to String for comparison with JWT-stored String schoolId
            return user.schoolId != null && student.getSchoolId() != null 
                && user.schoolId.equals(student.getSchoolId().toString());
        }
        
        return false;
    }

    /**
     * Check if user can modify student data
     */
    public boolean canModifyStudent(UserContext user, UUID studentId) {
        if (user == null) return false;
        
        // SuperAdmin can modify all
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        Student student = studentRepository.findById(studentId).orElse(null);
        if (student == null) return false;
        
        // Students can only modify limited fields of their own data
        if ("STUDENT".equalsIgnoreCase(user.role)) {
            return student.getUserId() != null && student.getUserId().equals(user.userId);
        }
        
        // Admin/Teacher can modify students in their school
        if ("ADMIN".equalsIgnoreCase(user.role) || "TEACHER".equalsIgnoreCase(user.role)) {
            // Convert Long schoolId to String for comparison with JWT-stored String schoolId
            return user.schoolId != null && student.getSchoolId() != null 
                && user.schoolId.equals(student.getSchoolId().toString());
        }
        
        return false;
    }

    /**
     * Check if user can access activity
     */
    public boolean canAccessActivity(UserContext user, UUID activityId) {
        if (user == null) return false;
        
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        Activity activity = activityRepository.findById(activityId).orElse(null);
        if (activity == null) return false;
        
        // Users can access activities in their school
        // Convert Long schoolId to String for comparison with JWT-stored String schoolId
        return user.schoolId != null && activity.getSchoolId() != null 
            && user.schoolId.equals(activity.getSchoolId().toString());
    }

    /**
     * Check if user can modify activity
     */
    public boolean canModifyActivity(UserContext user, UUID activityId) {
        if (user == null) return false;
        
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        Activity activity = activityRepository.findById(activityId).orElse(null);
        if (activity == null) return false;
        
        // Only Admin/Teacher in same school can modify
        if ("ADMIN".equalsIgnoreCase(user.role) || "TEACHER".equalsIgnoreCase(user.role)) {
            // Convert Long schoolId to String for comparison with JWT-stored String schoolId
            return user.schoolId != null && activity.getSchoolId() != null 
                && user.schoolId.equals(activity.getSchoolId().toString());
        }
        
        return false;
    }

    /**
     * Check if user can access message
     */
    public boolean canAccessMessage(UserContext user, UUID messageId) {
        if (user == null) return false;
        
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        Message message = messageRepository.findById(messageId).orElse(null);
        if (message == null) return false;
        
        // User must be sender or recipient
        return message.getSenderId().equals(user.userId) || 
               message.getRecipientId().equals(user.userId);
    }

    /**
     * Check if user can access resource
     */
    public boolean canAccessResource(UserContext user, UUID resourceId) {
        if (user == null) return false;
        
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        Resource resource = resourceRepository.findById(resourceId).orElse(null);
        if (resource == null) return false;
        
        // Users can access resources in their school
        // Convert Long schoolId to String for comparison with JWT-stored String schoolId
        return user.schoolId != null && resource.getSchoolId() != null 
            && user.schoolId.equals(resource.getSchoolId().toString());
    }

    /**
     * Check if user can modify resource
     */
    public boolean canModifyResource(UserContext user, UUID resourceId) {
        if (user == null) return false;
        
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        Resource resource = resourceRepository.findById(resourceId).orElse(null);
        if (resource == null) return false;
        
        // Only Admin/Teacher in same school can modify
        if ("ADMIN".equalsIgnoreCase(user.role) || "TEACHER".equalsIgnoreCase(user.role)) {
            // Convert Long schoolId to String for comparison with JWT-stored String schoolId
            return user.schoolId != null && resource.getSchoolId() != null 
                && user.schoolId.equals(resource.getSchoolId().toString());
        }
        
        return false;
    }

    /**
     * Check if user can access class
     */
    public boolean canAccessClass(UserContext user, UUID classId) {
        if (user == null) return false;
        
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        Classe classe = classeRepository.findById(classId).orElse(null);
        if (classe == null) return false;
        
        // Users can access classes in their school
        // Convert Long schoolId to String for comparison with JWT-stored String schoolId
        return user.schoolId != null && classe.getSchoolId() != null 
            && user.schoolId.equals(classe.getSchoolId().toString());
    }

    /**
     * Check if user belongs to school
     */
    public boolean belongsToSchool(UserContext user, Long schoolId) {
        if (user == null) return false;
        
        if ("SUPERADMIN".equalsIgnoreCase(user.role)) {
            return true;
        }
        
        return user.schoolId != null && user.schoolId.equals(schoolId != null ? schoolId.toString() : null);
    }

    /**
     * User context holder
     */
    public static class UserContext {
        public final UUID userId;
        public final String role;
        public final String schoolId;

        public UserContext(UUID userId, String role, String schoolId) {
            this.userId = userId;
            this.role = role;
            this.schoolId = schoolId;
        }
    }
}
