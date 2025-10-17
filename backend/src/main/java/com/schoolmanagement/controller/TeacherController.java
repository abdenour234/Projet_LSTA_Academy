package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teachers")
@CrossOrigin(origins = "*")
public class TeacherController {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;

    public TeacherController(ProfileRepository profileRepository, UserRoleRepository userRoleRepository) {
        this.profileRepository = profileRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<Profile>> getTeachersBySchool(@PathVariable String schoolId) {
        // Get all profiles for this school
        List<Profile> allProfiles = profileRepository.findBySchoolId(schoolId);
        
        // Filter only teachers
        List<UUID> profileIds = allProfiles.stream().map(Profile::getId).collect(Collectors.toList());
        List<UserRole> teacherRoles = userRoleRepository.findByUserIdInAndRole(profileIds, UserRole.Role.teacher);
        List<UUID> teacherIds = teacherRoles.stream().map(UserRole::getUserId).collect(Collectors.toList());
        
        List<Profile> teachers = allProfiles.stream()
                .filter(p -> teacherIds.contains(p.getId()))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(teachers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Profile> getTeacher(@PathVariable UUID id) {
        Profile teacher = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        return ResponseEntity.ok(teacher);
    }
}
