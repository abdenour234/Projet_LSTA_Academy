package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import com.schoolmanagement.service.OwnershipValidationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teachers")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
public class TeacherController {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final OwnershipValidationService ownershipValidator;

    public TeacherController(ProfileRepository profileRepository, 
                           UserRoleRepository userRoleRepository,
                           OwnershipValidationService ownershipValidator) {
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
        this.ownershipValidator = ownershipValidator;
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<Profile>> getTeachersBySchool(
            @PathVariable Long schoolId,
            Authentication authentication) {
        
        // Validate user can access this school's data
        ownershipValidator.validateSchoolAccess(schoolId, authentication);
        
        // Get all profiles for this school
        List<Profile> allProfiles = profileRepository.findBySchoolId(schoolId);
        
        // Filter only teachers
        List<UUID> profileIds = allProfiles.stream().map(Profile::getId).collect(Collectors.toList());
        List<UserRole> teacherRoles = userRoleRepository.findByUserIdInAndRole(profileIds, UserRole.Role.TEACHER);
        List<UUID> teacherIds = teacherRoles.stream().map(UserRole::getUserId).collect(Collectors.toList());
        
        List<Profile> teachers = allProfiles.stream()
                .filter(p -> teacherIds.contains(p.getId()))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(teachers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profile> getTeacher(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Profile teacher = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        // Validate user can access this teacher's school data
        ownershipValidator.validateSchoolAccess(teacher.getSchoolId(), authentication);
        
        return ResponseEntity.ok(teacher);
    }
}
