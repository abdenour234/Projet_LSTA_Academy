package com.schoolmanagement.service;

import com.schoolmanagement.dto.CreateTeacherRequest;
import com.schoolmanagement.dto.TeacherResponse;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.entity.UserRole.AppRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeacherService {
    
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public TeacherResponse createTeacher(CreateTeacherRequest request) {
        // Check if email already exists
        if (profileRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Create profile
        Profile profile = new Profile();
        profile.setId(UUID.randomUUID());
        profile.setEmail(request.getEmail());
        profile.setPassword(passwordEncoder.encode(request.getPassword()));
        profile.setFullName(request.getFullName());
        profile.setSchoolId(request.getSchoolId());
        profile.setMatiere(request.getMatiere());
        profile.setPhone(request.getPhone());

        profile = profileRepository.save(profile);

        // Create user role (TEACHER)
        UserRole userRole = new UserRole();
        userRole.setId(UUID.randomUUID());
        userRole.setUserId(profile.getId());
        userRole.setRole(AppRole.teacher);
        userRoleRepository.save(userRole);

        // Return response
        return new TeacherResponse(
            profile.getId(),
            profile.getEmail(),
            profile.getFullName(),
            profile.getSchoolId(),
            profile.getMatiere(),
            profile.getPhone()
        );
    }

    public TeacherResponse getTeacher(UUID id) {
        Profile profile = profileRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Teacher not found"));

        return new TeacherResponse(
            profile.getId(),
            profile.getEmail(),
            profile.getFullName(),
            profile.getSchoolId(),
            profile.getMatiere(),
            profile.getPhone()
        );
    }
}
