package com.schoolmanagement.controller;

import com.schoolmanagement.dto.AdminSignupRequest;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.School;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.SchoolRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import com.schoolmanagement.util.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(ProfileRepository profileRepository, 
                         UserRoleRepository userRoleRepository,
                         SchoolRepository schoolRepository,
                         PasswordEncoder passwordEncoder,
                         JwtUtil jwtUtil) {
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.schoolRepository = schoolRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        // Find profile by email
        Profile profile = profileRepository.findByEmail(email);
        if (profile == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        // Verify password
        if (profile.getPasswordHash() == null || !passwordEncoder.matches(password, profile.getPasswordHash())) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        // Get user role
        List<UserRole> roles = userRoleRepository.findByUserId(profile.getId());
        if (roles.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "No role assigned");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String role = roles.get(0).getRole().name();

        // Generate JWT token
        String token = jwtUtil.generateToken(profile.getId(), profile.getEmail(), role, profile.getSchoolId());

        // Return user data and token
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        
        Map<String, Object> user = new HashMap<>();
        user.put("id", profile.getId().toString());
        user.put("email", profile.getEmail());
        user.put("fullName", profile.getFullName());
        user.put("schoolId", profile.getSchoolId());
        user.put("role", role);
        
        response.put("user", user);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/signup-admin")
    @Transactional
    public ResponseEntity<Map<String, Object>> signupAdmin(@RequestBody AdminSignupRequest request) {
        // Validate required fields
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Email is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Password is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (request.getPassword().length() < 6) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Password must be at least 6 characters");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (request.getSchoolName() == null || request.getSchoolName().trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "School name is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // Check if user already exists
        if (profileRepository.findByEmail(request.getEmail()) != null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "An account with this email already exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        try {
            // Step 1: Create the school (ID will be auto-generated)
            School school = new School();
            school.setName(request.getSchoolName());
            school.setCity(request.getSchoolCity() != null ? request.getSchoolCity() : "");
            school.setRegion(request.getSchoolRegion() != null ? request.getSchoolRegion() : "");
            school.setLevel(request.getSchoolLevel() != null ? request.getSchoolLevel() : "Primaire");
            school.setStatus(request.getSchoolStatus() != null ? request.getSchoolStatus() : "Public");
            school.setAddress(request.getSchoolAddress() != null ? request.getSchoolAddress() : "");
            school.setStudents(request.getSchoolStudents() != null ? request.getSchoolStudents() : 0);
            
            School savedSchool = schoolRepository.save(school);

            // Step 2: Create the admin profile
            Profile profile = new Profile();
            profile.setEmail(request.getEmail());
            profile.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            profile.setFullName(request.getFullName() != null ? request.getFullName() : request.getEmail().split("@")[0]);
            profile.setSchoolId(String.valueOf(savedSchool.getId())); // Use the auto-generated school ID
            
            Profile savedProfile = profileRepository.save(profile);

            // Step 3: Create admin role
            UserRole userRole = new UserRole();
            userRole.setUserId(savedProfile.getId());
            userRole.setRole(UserRole.Role.admin);
            userRoleRepository.save(userRole);

            // Step 4: Generate JWT token
            String token = jwtUtil.generateToken(
                savedProfile.getId(), 
                savedProfile.getEmail(), 
                "admin", 
                savedProfile.getSchoolId()
            );

            // Step 5: Return response
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            
            Map<String, Object> user = new HashMap<>();
            user.put("id", savedProfile.getId().toString());
            user.put("email", savedProfile.getEmail());
            user.put("fullName", savedProfile.getFullName());
            user.put("schoolId", savedProfile.getSchoolId());
            user.put("role", "admin");
            
            Map<String, Object> schoolData = new HashMap<>();
            schoolData.put("id", savedSchool.getId());
            schoolData.put("name", savedSchool.getName());
            schoolData.put("city", savedSchool.getCity());
            schoolData.put("region", savedSchool.getRegion());
            
            response.put("user", user);
            response.put("school", schoolData);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Failed to create account: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> userDto) {
        String email = userDto.get("email");
        String password = userDto.get("password");
        String fullName = userDto.get("fullName");
        String schoolId = userDto.get("schoolId");
        String roleStr = userDto.get("role");

        // Validate required fields
        if (email == null || email.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Email is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (password == null || password.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Password is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (schoolId == null || schoolId.trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "School ID is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // Check if user exists
        if (profileRepository.findByEmail(email) != null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "User already exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        // Create profile with auto-generated ID
        Profile profile = new Profile();
        // ID will be auto-generated by @GeneratedValue
        profile.setEmail(email);
        profile.setPasswordHash(passwordEncoder.encode(password));
        profile.setFullName(fullName != null ? fullName : email.split("@")[0]);
        profile.setSchoolId(schoolId);
        
        Profile savedProfile = profileRepository.save(profile);

        // Create user role
        UserRole userRole = new UserRole();
        userRole.setUserId(savedProfile.getId());
        
        // Parse role, default to teacher if not provided or invalid
        UserRole.Role parsedRole = UserRole.Role.teacher;
        if (roleStr != null && !roleStr.trim().isEmpty()) {
            try {
                parsedRole = UserRole.Role.valueOf(roleStr.toLowerCase().trim());
            } catch (IllegalArgumentException e) {
                // Invalid role, default to teacher
                parsedRole = UserRole.Role.teacher;
            }
        }
        userRole.setRole(parsedRole);
        userRoleRepository.save(userRole);

        // Generate token
        String token = jwtUtil.generateToken(savedProfile.getId(), savedProfile.getEmail(), 
                userRole.getRole().name(), savedProfile.getSchoolId());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        
        Map<String, Object> user = new HashMap<>();
        user.put("id", savedProfile.getId().toString());
        user.put("email", savedProfile.getEmail());
        user.put("fullName", savedProfile.getFullName());
        user.put("schoolId", savedProfile.getSchoolId());
        user.put("role", userRole.getRole().name());
        
        response.put("user", user);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtUtil.extractUserId(token);
            
            Profile profile = profileRepository.findById(UUID.fromString(userId))
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            List<UserRole> roles = userRoleRepository.findByUserId(profile.getId());
            String role = roles.isEmpty() ? "teacher" : roles.get(0).getRole().name();

            Map<String, Object> user = new HashMap<>();
            user.put("id", profile.getId().toString());
            user.put("email", profile.getEmail());
            user.put("fullName", profile.getFullName());
            user.put("schoolId", profile.getSchoolId());
            user.put("role", role);

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // With JWT, logout is handled client-side by removing the token
        return ResponseEntity.ok().build();
    }
}
