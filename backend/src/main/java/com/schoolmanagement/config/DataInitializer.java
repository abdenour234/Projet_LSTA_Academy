package com.schoolmanagement.config;

import com.schoolmanagement.entity.School;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.SchoolRepository;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Initializes the database with default data on first startup.
 * Creates SuperAdmin account and default school if they don't exist.
 * Data persists across restarts thanks to JPA update mode.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SchoolRepository schoolRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Starting data initialization...");
        
        try {
            initializeDefaultSchool();
            initializeSuperAdmin();
            log.info("Data initialization completed successfully!");
        } catch (Exception e) {
            log.error("Error during data initialization: {}", e.getMessage(), e);
        }
    }

    /**
     * Creates a default school if none exists.
     */
    private void initializeDefaultSchool() {
        long schoolCount = schoolRepository.count();
        
        if (schoolCount == 0) {
            log.info("No schools found. Creating default school...");
            
            School school = new School();
            school.setName("Pasteur");
            school.setAddress("Avenue Mohammed V");
            school.setCity("Oujda");
            school.setRegion("L'Oriental");
            school.setLevel("Primaire");
            school.setStatus("Active");
            school.setStudents(0);
            school.setCreatedAt(LocalDateTime.now());
            
            schoolRepository.save(school);
            log.info("✅ Default school 'Pasteur' created successfully (ID: {})", school.getId());
        } else {
            log.info("Schools already exist in database (count: {}). Skipping school creation.", schoolCount);
        }
    }

    /**
     * Creates SuperAdmin account if it doesn't exist.
     * Email: admin@admin.com
     * Password: admin
     */
    private void initializeSuperAdmin() {
        String superAdminEmail = "admin@admin.com";
        
        Profile existingProfile = profileRepository.findByEmail(superAdminEmail);
        if (existingProfile == null) {
            log.info("SuperAdmin account not found. Creating...");
            
            // Get the first school (created above or already exists)
            School firstSchool = schoolRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No school available for SuperAdmin"));
            
            // Create Profile
            Profile superAdminProfile = new Profile();
            superAdminProfile.setFullName("Super Admin");
            superAdminProfile.setEmail(superAdminEmail);
            superAdminProfile.setPasswordHash(passwordEncoder.encode("admin"));
            superAdminProfile.setSchoolId(firstSchool.getId());
            superAdminProfile.setCreatedAt(LocalDateTime.now());
            superAdminProfile.setUpdatedAt(LocalDateTime.now());
            
            Profile savedProfile = profileRepository.save(superAdminProfile);
            
            // Create UserRole
            UserRole userRole = new UserRole();
            userRole.setUserId(savedProfile.getId());
            userRole.setRole(UserRole.Role.SUPERADMIN);
            
            userRoleRepository.save(userRole);
            
            log.info("✅ SuperAdmin account created successfully!");
            log.info("   Email: {}", superAdminEmail);
            log.info("   Password: admin");
            log.info("   Role: SUPERADMIN");
        } else {
            log.info("SuperAdmin account already exists. Skipping creation.");
        }
    }
}
