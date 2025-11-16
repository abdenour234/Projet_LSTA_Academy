package com.schoolmanagement.controller;

import com.schoolmanagement.dto.TeacherDTO;
import com.schoolmanagement.entity.Teacher;
import com.schoolmanagement.service.OwnershipValidationService;
import com.schoolmanagement.service.TeacherService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * TeacherManagementController
 * REST API endpoints for teacher management.
 * Separate from the existing TeacherController which handles profile-based operations.
 * 
 * Sprint 1 - Ticket 8: Teacher REST API
 * Provides endpoints for:
 * - Creating and updating teachers with specialty
 * - Retrieving teachers by school and specialty
 * - Managing teacher status
 */
@RestController
@RequestMapping("/api/teacher-management")
@CrossOrigin(origins = "*")
public class TeacherManagementController {

    private final TeacherService teacherService;
    private final OwnershipValidationService ownershipValidator;

    public TeacherManagementController(TeacherService teacherService,
                                       OwnershipValidationService ownershipValidator) {
        this.teacherService = teacherService;
        this.ownershipValidator = ownershipValidator;
    }

    /**
     * Create a new teacher
     * Only ADMIN can create teachers
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Teacher> createTeacher(
            @Valid @RequestBody TeacherDTO dto,
            Authentication authentication) {
        
        // Validate user can access this school
        ownershipValidator.validateSchoolAccess(dto.getSchoolId(), authentication);
        
        Teacher teacher = teacherService.createTeacher(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(teacher);
    }

    /**
     * Update an existing teacher
     * Only ADMIN can update teachers
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Teacher> updateTeacher(
            @PathVariable UUID id,
            @Valid @RequestBody TeacherDTO dto,
            Authentication authentication) {
        
        // Get existing teacher to verify school access
        Teacher existing = teacherService.getTeacherById(id);
        ownershipValidator.validateSchoolAccess(existing.getSchoolId(), authentication);
        
        Teacher teacher = teacherService.updateTeacher(id, dto);
        return ResponseEntity.ok(teacher);
    }

    /**
     * Get all teachers for a school
     */
    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'TEACHER')")
    public ResponseEntity<List<Teacher>> getTeachersBySchool(
            @PathVariable Long schoolId,
            @RequestParam(required = false) String specialty,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            Authentication authentication) {
        
        // Validate user can access this school
        ownershipValidator.validateSchoolAccess(schoolId, authentication);
        
        List<Teacher> teachers;
        if (specialty != null && !specialty.isEmpty()) {
            teachers = teacherService.getTeachersBySpecialty(schoolId, specialty);
        } else if (activeOnly) {
            teachers = teacherService.getActiveTeachersBySchool(schoolId);
        } else {
            teachers = teacherService.getTeachersBySchool(schoolId);
        }
        
        return ResponseEntity.ok(teachers);
    }

    /**
     * Get a specific teacher by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'TEACHER')")
    public ResponseEntity<Teacher> getTeacher(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Teacher teacher = teacherService.getTeacherById(id);
        ownershipValidator.validateSchoolAccess(teacher.getSchoolId(), authentication);
        
        return ResponseEntity.ok(teacher);
    }

    /**
     * Get teacher by profile ID
     */
    @GetMapping("/profile/{profileId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'TEACHER')")
    public ResponseEntity<Teacher> getTeacherByProfile(
            @PathVariable UUID profileId,
            Authentication authentication) {
        
        Teacher teacher = teacherService.getTeacherByProfileId(profileId);
        ownershipValidator.validateSchoolAccess(teacher.getSchoolId(), authentication);
        
        return ResponseEntity.ok(teacher);
    }

    /**
     * Toggle teacher active status
     * Only ADMIN can toggle status
     */
    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Teacher> toggleTeacherStatus(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Teacher existing = teacherService.getTeacherById(id);
        ownershipValidator.validateSchoolAccess(existing.getSchoolId(), authentication);
        
        Teacher teacher = teacherService.toggleTeacherStatus(id);
        return ResponseEntity.ok(teacher);
    }

    /**
     * Delete a teacher
     * Only ADMIN can delete teachers
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> deleteTeacher(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Teacher existing = teacherService.getTeacherById(id);
        ownershipValidator.validateSchoolAccess(existing.getSchoolId(), authentication);
        
        teacherService.deleteTeacher(id);
        return ResponseEntity.noContent().build();
    }
}
