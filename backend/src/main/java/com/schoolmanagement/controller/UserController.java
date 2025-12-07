package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.repository.ProfileRepository;
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

        public UserDTO(Profile profile) {
            this.id = profile.getId();
            this.firstName = profile.getFirstName();
            this.lastName = profile.getLastName();
            this.email = profile.getEmail();
            this.role = profile.getRole().name();
            this.schoolId = profile.getSchool() != null ? profile.getSchool().getId() : null;
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
        if (profile.getSchool() == null || !profile.getSchool().getId().equals(schoolId)) {
            log.warn("User {} not in school {}", email, schoolId);
            return ResponseEntity.status(403).body(Map.of("error", "Utilisateur dans une autre école"));
        }

        log.info("User found: {} ({})", profile.getEmail(), profile.getRole());
        return ResponseEntity.ok(new UserDTO(profile));
    }

    /**
     * List all users in the same school (TEACHER + ADMIN only)
     * Returns only users who can use messaging system
     */
    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<UserDTO>> getUsersBySchool(@PathVariable Long schoolId) {
        
        log.info("GET /users/school/{} - Listing users for messaging", schoolId);

        // Find all profiles in this school with TEACHER or ADMIN role
        List<Profile> profiles = profileRepository.findAll().stream()
                .filter(p -> p.getSchool() != null && p.getSchool().getId().equals(schoolId))
                .filter(p -> p.getRole().name().equals("TEACHER") || p.getRole().name().equals("ADMIN"))
                .sorted(Comparator.comparing(Profile::getLastName)
                        .thenComparing(Profile::getFirstName))
                .collect(Collectors.toList());

        log.info("Found {} users in school {}", profiles.size(), schoolId);

        List<UserDTO> dtos = profiles.stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());

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

        List<Profile> profiles = profileRepository.findAll().stream()
                .filter(p -> p.getSchool() != null && p.getSchool().getId().equals(schoolId))
                .filter(p -> p.getRole().name().equals("TEACHER") || p.getRole().name().equals("ADMIN"))
                .filter(p -> 
                    p.getEmail().toLowerCase().contains(lowerQuery) ||
                    p.getFirstName().toLowerCase().contains(lowerQuery) ||
                    p.getLastName().toLowerCase().contains(lowerQuery) ||
                    (p.getFirstName() + " " + p.getLastName()).toLowerCase().contains(lowerQuery)
                )
                .sorted(Comparator.comparing(Profile::getLastName)
                        .thenComparing(Profile::getFirstName))
                .limit(limit)
                .collect(Collectors.toList());

        log.info("Search returned {} results", profiles.size());

        List<UserDTO> dtos = profiles.stream()
                .map(UserDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
