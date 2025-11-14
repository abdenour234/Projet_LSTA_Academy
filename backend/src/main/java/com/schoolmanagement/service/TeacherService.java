package com.schoolmanagement.service;

import com.schoolmanagement.dto.TeacherDTO;
import com.schoolmanagement.entity.Teacher;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.TeacherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * TeacherService
 * Service layer for managing teachers.
 * 
 * Sprint 1 - Ticket 7: Service for teacher management
 * Handles business logic for:
 * - Creating and updating teachers
 * - Retrieving teachers by school and specialty
 * - Validating teacher-profile relationships
 */
@Service
@Transactional
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final ProfileRepository profileRepository;

    public TeacherService(TeacherRepository teacherRepository, ProfileRepository profileRepository) {
        this.teacherRepository = teacherRepository;
        this.profileRepository = profileRepository;
    }

    /**
     * Create a new teacher
     */
    public Teacher createTeacher(TeacherDTO dto) {
        // Validate profile exists
        if (!profileRepository.existsById(dto.getProfileId())) {
            throw new RuntimeException("Profile not found with id: " + dto.getProfileId());
        }

        // Check if teacher already exists for this profile
        if (teacherRepository.existsByProfileId(dto.getProfileId())) {
            throw new RuntimeException("Teacher already exists for this profile");
        }

        Teacher teacher = new Teacher();
        teacher.setProfileId(dto.getProfileId());
        teacher.setSchoolId(dto.getSchoolId());
        teacher.setSpecialty(dto.getSpecialty());
        teacher.setPhoneNumber(dto.getPhoneNumber());
        teacher.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        return teacherRepository.save(teacher);
    }

    /**
     * Update an existing teacher
     */
    public Teacher updateTeacher(UUID id, TeacherDTO dto) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found with id: " + id));

        teacher.setSpecialty(dto.getSpecialty());
        teacher.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getIsActive() != null) {
            teacher.setIsActive(dto.getIsActive());
        }

        return teacherRepository.save(teacher);
    }

    /**
     * Get all teachers for a school
     */
    @Transactional(readOnly = true)
    public List<Teacher> getTeachersBySchool(Long schoolId) {
        return teacherRepository.findBySchoolId(schoolId);
    }

    /**
     * Get all active teachers for a school
     */
    @Transactional(readOnly = true)
    public List<Teacher> getActiveTeachersBySchool(Long schoolId) {
        return teacherRepository.findBySchoolIdAndIsActiveTrue(schoolId);
    }

    /**
     * Get teachers by specialty within a school
     */
    @Transactional(readOnly = true)
    public List<Teacher> getTeachersBySpecialty(Long schoolId, String specialty) {
        return teacherRepository.findBySchoolIdAndSpecialtyAndIsActiveTrue(schoolId, specialty);
    }

    /**
     * Get a specific teacher by ID
     */
    @Transactional(readOnly = true)
    public Teacher getTeacherById(UUID id) {
        return teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found with id: " + id));
    }

    /**
     * Get teacher by profile ID
     */
    @Transactional(readOnly = true)
    public Teacher getTeacherByProfileId(UUID profileId) {
        return teacherRepository.findByProfileId(profileId)
                .orElseThrow(() -> new RuntimeException("Teacher not found for profile id: " + profileId));
    }

    /**
     * Delete a teacher
     */
    public void deleteTeacher(UUID id) {
        if (!teacherRepository.existsById(id)) {
            throw new RuntimeException("Teacher not found with id: " + id);
        }
        teacherRepository.deleteById(id);
    }

    /**
     * Toggle teacher active status
     */
    public Teacher toggleTeacherStatus(UUID id) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teacher not found with id: " + id));
        
        teacher.setIsActive(!teacher.getIsActive());
        return teacherRepository.save(teacher);
    }
}
