package com.schoolmanagement.controller;

import com.schoolmanagement.dto.AdminSignupRequest;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.School;
import com.schoolmanagement.entity.Student;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.SchoolRepository;
import com.schoolmanagement.repository.StudentRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import com.schoolmanagement.util.JwtUtil;
import com.schoolmanagement.util.InputSanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final SchoolRepository schoolRepository;
    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final InputSanitizer inputSanitizer;

    public AuthController(ProfileRepository profileRepository,
                          UserRoleRepository userRoleRepository,
                          SchoolRepository schoolRepository,
                          StudentRepository studentRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          InputSanitizer inputSanitizer) {
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.schoolRepository = schoolRepository;
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.inputSanitizer = inputSanitizer;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        
        // Sanitize email input
        try {
            email = inputSanitizer.sanitizeEmail(email);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid email format");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        Profile profile = profileRepository.findByEmail(email);
        if (profile == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        if (profile.getPasswordHash() == null || !passwordEncoder.matches(password, profile.getPasswordHash())) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        List<UserRole> roles = userRoleRepository.findByUserId(profile.getId());
        if (roles.isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "No role assigned");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String role = roles.get(0).getRole().name();
        String token = jwtUtil.generateToken(profile.getId(), profile.getEmail(), role, profile.getSchoolId());

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
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> signupAdmin(@RequestBody AdminSignupRequest request) {
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

        if (request.getPassword().length() < 8) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Password must be at least 8 characters");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
        
        // Password complexity check
        if (!isPasswordComplex(request.getPassword())) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Password must contain at least one uppercase letter, one lowercase letter, and one number");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (request.getSchoolName() == null || request.getSchoolName().trim().isEmpty()) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "School name is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        if (profileRepository.findByEmail(request.getEmail()) != null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "An account with this email already exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        try {
            School school = new School();
            school.setName(request.getSchoolName());
            school.setCity(request.getSchoolCity() != null ? request.getSchoolCity() : "");
            school.setRegion(request.getSchoolRegion() != null ? request.getSchoolRegion() : "");
            school.setLevel(request.getSchoolLevel() != null ? request.getSchoolLevel() : "Primaire");
            school.setStatus(request.getSchoolStatus() != null ? request.getSchoolStatus() : "Public");
            school.setAddress(request.getSchoolAddress() != null ? request.getSchoolAddress() : "");
            school.setStudents(request.getSchoolStudents() != null ? request.getSchoolStudents() : 0);

            School savedSchool = schoolRepository.save(school);

            Profile profile = new Profile();
            profile.setEmail(request.getEmail());
            profile.setPasswordHash(passwordEncoder.encode(request.getPassword()));
            profile.setFullName(request.getFullName() != null ? request.getFullName() : request.getEmail().split("@")[0]);
            profile.setSchoolId(String.valueOf(savedSchool.getId()));

            Profile savedProfile = profileRepository.save(profile);

            UserRole userRole = new UserRole();
            userRole.setUserId(savedProfile.getId());
            userRole.setRole(UserRole.Role.admin);
            userRoleRepository.save(userRole);

            String token = jwtUtil.generateToken(
                    savedProfile.getId(),
                    savedProfile.getEmail(),
                    "admin",
                    savedProfile.getSchoolId()
            );

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
            e.printStackTrace();
            throw new RuntimeException("Failed to create account: " + e.getMessage(), e);
        }
    }

    @PostMapping("/register")
    @Transactional(rollbackFor = Exception.class)
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, Object> userDto) {
        String email = (String) userDto.get("email");
        String password = (String) userDto.get("password");
        String fullName = (String) userDto.get("fullName");
        String schoolId = (String) userDto.get("schoolId");
        String roleStr = (String) userDto.get("role");
        String dateOfBirth = (String) userDto.get("dateOfBirth"); // NEW
        String gender = (String) userDto.get("gender"); // NEW
        String parentContact = (String) userDto.get("parentContact"); // NEW
        UUID classId = userDto.get("classId") != null ? UUID.fromString((String) userDto.get("classId")) : null; // NEW

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

        if (profileRepository.findByEmail(email) != null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "User already exists");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }

        try {
            Profile profile = new Profile();
            profile.setEmail(email);
            profile.setPasswordHash(passwordEncoder.encode(password));
            profile.setFullName(fullName != null ? fullName : email.split("@")[0]);
            profile.setSchoolId(schoolId);

            Profile savedProfile = profileRepository.save(profile);

            UserRole userRole = new UserRole();
            userRole.setUserId(savedProfile.getId());

            UserRole.Role parsedRole = UserRole.Role.teacher;
            if (roleStr != null && !roleStr.trim().isEmpty()) {
                try {
                    parsedRole = UserRole.Role.valueOf(roleStr.toLowerCase().trim());
                } catch (IllegalArgumentException e) {
                    parsedRole = UserRole.Role.teacher;
                }
            }
            userRole.setRole(parsedRole);
            userRoleRepository.save(userRole);

            if (parsedRole == UserRole.Role.student) {
                // Check if student already exists for this userId
                Optional<Student> existingStudentOpt = studentRepository.findByUserId(savedProfile.getId());
                if (!existingStudentOpt.isPresent()) {
                    Student student = new Student();
                    student.setUserId(savedProfile.getId());
                    student.setFirstName(fullName != null ? fullName.split(" ")[0] : email.split("@")[0]);
                    student.setLastName(fullName != null && fullName.contains(" ") ? fullName.split(" ", 2)[1] : "");
                    student.setSchoolId(schoolId);
                    student.setClassId(classId); // NEW: Set classId if provided
                    student.setDateOfBirth(dateOfBirth != null && !dateOfBirth.trim().isEmpty()
                            ? LocalDate.parse(dateOfBirth).atStartOfDay()
                            : null);
                    student.setGender(gender); // NEW
                    student.setParentContact(parentContact); // NEW
                    student.setCreatedAt(LocalDateTime.now());
                    student.setUpdatedAt(LocalDateTime.now());
                    studentRepository.save(student);
                }
            }

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
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to register user: " + e.getMessage(), e);
        }
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
    
    /**
     * Validate password complexity
     * Requires at least: 1 uppercase, 1 lowercase, 1 number
     */
    private boolean isPasswordComplex(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        boolean hasUppercase = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLowercase = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        
        return hasUppercase && hasLowercase && hasDigit;
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.ok().build();
    }
}