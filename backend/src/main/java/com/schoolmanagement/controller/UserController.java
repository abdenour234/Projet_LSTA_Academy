package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * UserController - REST API for user/profile operations
 * Used by messaging system to find users by email or list users by school
 */
@RestController
@RequestMapping("/api/users")
@Slf4j
public class UserController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    /**
     * DTO for user response - minimal info for privacy
     */
    public static class UserDTO {
        public UUID id;
        public String firstName;
        public String lastName;
        public String email;
        public String role;
        public Long schoolId;

        public UserDTO(Profile profile, UserRole userRole) {
            this.id = profile.getId();
            // Parse fullName into firstName and lastName
            String fullName = profile.getFullName() != null ? profile.getFullName() : "";
            String[] nameParts = fullName.trim().split("\\s+", 2);
            this.firstName = nameParts.length > 0 ? nameParts[0] : "";
            this.lastName = nameParts.length > 1 ? nameParts[1] : "";
            this.email = profile.getEmail();
            this.role = userRole != null ? userRole.getRole().name() : "UNKNOWN";
            this.schoolId = profile.getSchoolId();
        }
    }

    /**
     * Find user by email (exact match, case-insensitive)
     * Used when creating conversations by typing email
     */
    @GetMapping("/by-email")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getUserByEmail(
            @RequestParam String email,
            @RequestParam Long schoolId) {
        
        log.info("GET /users/by-email - Email: {}, SchoolId: {}", email, schoolId);

        Profile profile = profileRepository.findByEmail(email);

        if (profile == null) {
            log.warn("User not found by email: {}", email);
            return ResponseEntity.status(404).body(Map.of("error", "Utilisateur introuvable"));
        }

        // Verify user belongs to same school (security check)
        if (!profile.getSchoolId().equals(schoolId)) {
            log.warn("User {} not in school {}", email, schoolId);
            return ResponseEntity.status(403).body(Map.of("error", "Utilisateur dans une autre école"));
        }

        // Get user role
        List<UserRole> roles = userRoleRepository.findByUserId(profile.getId());
        UserRole userRole = roles.isEmpty() ? null : roles.get(0);

        if (userRole == null) {
            log.warn("User {} has no role assigned", email);
            return ResponseEntity.status(403).body(Map.of("error", "Utilisateur sans rôle"));
        }

        log.info("User found: {} ({})", profile.getEmail(), userRole.getRole());
        return ResponseEntity.ok(new UserDTO(profile, userRole));
    }

    /**
     * List all users in the same school (TEACHER + ADMIN only)
     * Returns only users who can use messaging system
     */
    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<UserDTO>> getUsersBySchool(@PathVariable Long schoolId) {
        
        log.info("GET /users/school/{} - Listing users for messaging", schoolId);

        // Find all UserRoles with TEACHER or ADMIN in this school
        List<UserRole> teacherRoles = userRoleRepository.findByRole(UserRole.Role.TEACHER);
        List<UserRole> adminRoles = userRoleRepository.findByRole(UserRole.Role.ADMIN);
        
        List<UUID> userIds = new ArrayList<>();
        teacherRoles.forEach(r -> userIds.add(r.getUserId()));
        adminRoles.forEach(r -> userIds.add(r.getUserId()));

        // Get profiles for these users
        Map<UUID, UserRole> roleMap = new HashMap<>();
        teacherRoles.forEach(r -> roleMap.put(r.getUserId(), r));
        adminRoles.forEach(r -> roleMap.put(r.getUserId(), r));

        List<UserDTO> dtos = profileRepository.findAll().stream()
                .filter(p -> userIds.contains(p.getId()))
                .filter(p -> p.getSchoolId().equals(schoolId))
                .sorted(Comparator.comparing(
                        p -> p.getFullName() != null ? p.getFullName() : "", 
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(p -> new UserDTO(p, roleMap.get(p.getId())))
                .collect(Collectors.toList());

        log.info("Found {} users in school {}", dtos.size(), schoolId);

        return ResponseEntity.ok(dtos);
    }

    /**
     * Search users by name or email (for autocomplete)
     * Returns users in the same school matching the search term
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<UserDTO>> searchUsers(
            @RequestParam String query,
            @RequestParam Long schoolId,
            @RequestParam(defaultValue = "10") int limit) {
        
        log.info("GET /users/search - Query: '{}', SchoolId: {}, Limit: {}", query, schoolId, limit);

        String lowerQuery = query.toLowerCase().trim();

        // Get TEACHER and ADMIN roles
        List<UserRole> teacherRoles = userRoleRepository.findByRole(UserRole.Role.TEACHER);
        List<UserRole> adminRoles = userRoleRepository.findByRole(UserRole.Role.ADMIN);
        
        List<UUID> userIds = new ArrayList<>();
        teacherRoles.forEach(r -> userIds.add(r.getUserId()));
        adminRoles.forEach(r -> userIds.add(r.getUserId()));

        Map<UUID, UserRole> roleMap = new HashMap<>();
        teacherRoles.forEach(r -> roleMap.put(r.getUserId(), r));
        adminRoles.forEach(r -> roleMap.put(r.getUserId(), r));

        List<UserDTO> dtos = profileRepository.findAll().stream()
                .filter(p -> userIds.contains(p.getId()))
                .filter(p -> p.getSchoolId().equals(schoolId))
                .filter(p -> {
                    String email = p.getEmail() != null ? p.getEmail().toLowerCase() : "";
                    String fullName = p.getFullName() != null ? p.getFullName().toLowerCase() : "";
                    
                    return email.contains(lowerQuery) || fullName.contains(lowerQuery);
                })
                .sorted(Comparator.comparing(
                        p -> p.getFullName() != null ? p.getFullName() : "", 
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .limit(limit)
                .map(p -> new UserDTO(p, roleMap.get(p.getId())))
                .collect(Collectors.toList());

        log.info("Search returned {} results", dtos.size());

        return ResponseEntity.ok(dtos);
    }
}
