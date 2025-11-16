package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.School;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.SchoolRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/superadmin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('SUPERADMIN')")
public class SuperAdminController {
    /**
     * Reset password for any user (admin, teacher, student) by user ID
     * Only accessible by SUPERADMIN
     */
    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Map<String, Object>> resetUserPassword(@PathVariable UUID id) {
        try {
            Optional<Profile> profileOpt = profileRepository.findById(id);
            if (profileOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found"));
            }
            Profile profile = profileOpt.get();
            // Generate a new random password
            String newPassword = UUID.randomUUID().toString().substring(0, 8);
            // TODO: Update password in user auth system (implement actual password update logic)
            // For demo, just return the new password
            // profile.setPassword(passwordEncoder.encode(newPassword)); // If using password field
            // profileRepository.save(profile);
            Map<String, Object> result = new HashMap<>();
            result.put("userId", id);
            result.put("newPassword", newPassword);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reset password: " + e.getMessage()));
        }
    }

    private final SchoolRepository schoolRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;

    public SuperAdminController(SchoolRepository schoolRepository,
                               ProfileRepository profileRepository,
                               UserRoleRepository userRoleRepository) {
        this.schoolRepository = schoolRepository;
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getGlobalStats() {
        try {
            // Get all schools
            List<School> schools = schoolRepository.findAll();
            
            // Get all profiles
            List<Profile> profiles = profileRepository.findAll();
            
            // Get all roles
            List<UserRole> roles = userRoleRepository.findAll();

            // Calculate global stats
            Map<String, Object> globalStats = new HashMap<>();
            globalStats.put("totalSchools", schools.size());
            globalStats.put("totalUsers", profiles.size());
            
            // Count by role
            long adminCount = roles.stream()
                .filter(r -> r.getRole() == UserRole.Role.ADMIN)
                .count();
            long teacherCount = roles.stream()
                .filter(r -> r.getRole() == UserRole.Role.TEACHER)
                .count();
            long studentCount = roles.stream()
                .filter(r -> r.getRole() == UserRole.Role.STUDENT)
                .count();
            
            globalStats.put("totalAdmins", adminCount);
            globalStats.put("totalTeachers", teacherCount);
            globalStats.put("totalStudents", studentCount);

            // Calculate total students across all schools
            int totalSchoolStudents = schools.stream()
                .mapToInt(School::getStudents)
                .sum();
            globalStats.put("totalSchoolStudents", totalSchoolStudents);

            // School statistics (detailed)
            List<Map<String, Object>> schoolStats = schools.stream()
                .map(school -> {
                    Map<String, Object> stat = new HashMap<>();
                    stat.put("id", school.getId());
                    stat.put("name", school.getName());
                    stat.put("city", school.getCity());
                    stat.put("region", school.getRegion());
                    stat.put("level", school.getLevel());
                    stat.put("status", school.getStatus());
                    stat.put("students", school.getStudents());
                    stat.put("address", school.getAddress());
                    stat.put("createdAt", school.getCreatedAt());

                    // Count users for this school
                    long schoolUsers = profiles.stream()
                        .filter(p -> String.valueOf(school.getId()).equals(p.getSchoolId()))
                        .count();
                    stat.put("totalUsers", schoolUsers);

                    // Count teachers for this school
                    List<UUID> schoolUserIds = profiles.stream()
                        .filter(p -> String.valueOf(school.getId()).equals(p.getSchoolId()))
                        .map(Profile::getId)
                        .collect(Collectors.toList());
                    
                    long schoolTeachers = roles.stream()
                        .filter(r -> schoolUserIds.contains(r.getUserId()))
                        .filter(r -> r.getRole() == UserRole.Role.TEACHER)
                        .count();
                    stat.put("teachers", schoolTeachers);

                    return stat;
                })
                .collect(Collectors.toList());

            // Distribution by region
            Map<String, Long> regionDistribution = schools.stream()
                .collect(Collectors.groupingBy(
                    School::getRegion,
                    Collectors.counting()
                ));

            // Distribution by level
            Map<String, Long> levelDistribution = schools.stream()
                .collect(Collectors.groupingBy(
                    School::getLevel,
                    Collectors.counting()
                ));

            // Distribution by status
            Map<String, Long> statusDistribution = schools.stream()
                .collect(Collectors.groupingBy(
                    School::getStatus,
                    Collectors.counting()
                ));

            Map<String, Object> response = new HashMap<>();
            response.put("global", globalStats);
            response.put("schools", schoolStats);
            response.put("distribution", Map.of(
                "byRegion", regionDistribution,
                "byLevel", levelDistribution,
                "byStatus", statusDistribution
            ));

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch statistics: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/schools")
    public ResponseEntity<List<Map<String, Object>>> getAllSchoolsWithDetails() {
        try {
            List<School> schools = schoolRepository.findAll();
            List<Profile> profiles = profileRepository.findAll();
            List<UserRole> roles = userRoleRepository.findAll();

            List<Map<String, Object>> schoolDetails = schools.stream()
                .map(school -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("id", school.getId());
                    detail.put("name", school.getName());
                    detail.put("city", school.getCity());
                    detail.put("region", school.getRegion());
                    detail.put("level", school.getLevel());
                    detail.put("status", school.getStatus());
                    detail.put("address", school.getAddress());
                    detail.put("students", school.getStudents());
                    detail.put("createdAt", school.getCreatedAt());
                    detail.put("lastDiagnostic", school.getLastDiagnostic());

                    // Count users
                    List<Profile> schoolProfiles = profiles.stream()
                        .filter(p -> String.valueOf(school.getId()).equals(p.getSchoolId()))
                        .collect(Collectors.toList());
                    
                    detail.put("totalUsers", schoolProfiles.size());

                    // Count by role
                    List<UUID> schoolUserIds = schoolProfiles.stream()
                        .map(Profile::getId)
                        .collect(Collectors.toList());
                    
                    long admins = roles.stream()
                        .filter(r -> schoolUserIds.contains(r.getUserId()))
                        .filter(r -> r.getRole() == UserRole.Role.ADMIN)
                        .count();
                    
                    long teachers = roles.stream()
                        .filter(r -> schoolUserIds.contains(r.getUserId()))
                        .filter(r -> r.getRole() == UserRole.Role.TEACHER)
                        .count();

                    detail.put("admins", admins);
                    detail.put("teachers", teachers);

                    return detail;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(schoolDetails);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/schools/{schoolId}")
    public ResponseEntity<Map<String, Object>> getSchoolDetails(@PathVariable Long schoolId) {
        try {
            Optional<School> schoolOpt = schoolRepository.findById(schoolId);
            if (!schoolOpt.isPresent()) {
                Map<String, Object> error = new HashMap<>();
                error.put("error", "School not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            School school = schoolOpt.get();
            List<Profile> profiles = profileRepository.findAll();
            List<UserRole> roles = userRoleRepository.findAll();

            // Get school users
            List<Profile> schoolProfiles = profiles.stream()
                .filter(p -> String.valueOf(school.getId()).equals(p.getSchoolId()))
                .collect(Collectors.toList());

            List<UUID> schoolUserIds = schoolProfiles.stream()
                .map(Profile::getId)
                .collect(Collectors.toList());

            // Count by role
            long admins = roles.stream()
                .filter(r -> schoolUserIds.contains(r.getUserId()))
                .filter(r -> r.getRole() == UserRole.Role.ADMIN)
                .count();
            
            long teachers = roles.stream()
                .filter(r -> schoolUserIds.contains(r.getUserId()))
                .filter(r -> r.getRole() == UserRole.Role.TEACHER)
                .count();
            
            long students = roles.stream()
                .filter(r -> schoolUserIds.contains(r.getUserId()))
                .filter(r -> r.getRole() == UserRole.Role.STUDENT)
                .count();

            Map<String, Object> response = new HashMap<>();
            response.put("id", school.getId());
            response.put("name", school.getName());
            response.put("city", school.getCity());
            response.put("region", school.getRegion());
            response.put("level", school.getLevel());
            response.put("status", school.getStatus());
            response.put("address", school.getAddress());
            response.put("students", school.getStudents());
            response.put("createdAt", school.getCreatedAt());
            response.put("lastDiagnostic", school.getLastDiagnostic());
            response.put("totalUsers", schoolProfiles.size());
            response.put("admins", admins);
            response.put("teachers", teachers);
            response.put("students", students);

            // Get user list
            List<Map<String, Object>> users = schoolProfiles.stream()
                .map(profile -> {
                    Map<String, Object> user = new HashMap<>();
                    user.put("id", profile.getId());
                    user.put("email", profile.getEmail());
                    user.put("fullName", profile.getFullName());
                    user.put("createdAt", profile.getCreatedAt());

                    // Get role
                    Optional<UserRole> userRole = roles.stream()
                        .filter(r -> r.getUserId().equals(profile.getId()))
                        .findFirst();
                    
                    if (userRole.isPresent()) {
                        user.put("role", userRole.get().getRole().name());
                    }

                    return user;
                })
                .collect(Collectors.toList());

            response.put("users", users);

            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to fetch school details: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
