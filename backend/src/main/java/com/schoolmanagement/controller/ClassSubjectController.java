package com.schoolmanagement.controller;

import com.schoolmanagement.dto.ClassSubjectDTO;
import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.entity.ClassSubject;
import com.schoolmanagement.repository.ClasseRepository;
import com.schoolmanagement.service.ClassSubjectService;
import com.schoolmanagement.service.OwnershipValidationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * ClassSubjectController
 * REST API endpoints for managing class-subject-teacher assignments.
 * 
 * Sprint 1 - Ticket 8: ClassSubject REST API
 * Provides endpoints for:
 * - Assigning subjects to classes
 * - Assigning teachers to class subjects
 * - Retrieving class schedules
 */
@RestController
@RequestMapping("/api/class-subjects")
@CrossOrigin(origins = "*")
public class ClassSubjectController {

    private final ClassSubjectService classSubjectService;
    private final ClasseRepository classeRepository;
    private final OwnershipValidationService ownershipValidator;

    public ClassSubjectController(ClassSubjectService classSubjectService,
                                  ClasseRepository classeRepository,
                                  OwnershipValidationService ownershipValidator) {
        this.classSubjectService = classSubjectService;
        this.classeRepository = classeRepository;
        this.ownershipValidator = ownershipValidator;
    }

    /**
     * Assign a subject to a class
     * Only ADMIN can assign subjects
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<ClassSubject> assignSubjectToClass(
            @Valid @RequestBody ClassSubjectDTO dto,
            Authentication authentication) {
        
        // Validate class ownership
        ownershipValidator.validateClassSchoolAccess(dto.getClassId(), null, authentication);
        
        ClassSubject classSubject = classSubjectService.assignSubjectToClass(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(classSubject);
    }

    /**
     * Update a class-subject assignment (teacher or hours)
     * Only ADMIN can update assignments
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<ClassSubject> updateClassSubject(
            @PathVariable UUID id,
            @Valid @RequestBody ClassSubjectDTO dto,
            Authentication authentication) {
        
        // Get existing assignment to verify access
        ClassSubject existing = classSubjectService.getClassSubject(id);
        ownershipValidator.validateClassSchoolAccess(existing.getClassId(), null, authentication);
        
        ClassSubject classSubject = classSubjectService.updateClassSubject(id, dto);
        return ResponseEntity.ok(classSubject);
    }

    /**
     * Assign or update teacher for a class-subject
     * Only ADMIN can assign teachers
     */
    @PatchMapping("/class/{classId}/subject/{subjectId}/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<ClassSubject> assignTeacher(
            @PathVariable UUID classId,
            @PathVariable UUID subjectId,
            @PathVariable UUID teacherId,
            Authentication authentication) {
        
        // Validate class ownership
        ownershipValidator.validateClassSchoolAccess(classId, null, authentication);
        
        ClassSubject classSubject = classSubjectService.assignTeacherToClassSubject(classId, subjectId, teacherId);
        return ResponseEntity.ok(classSubject);
    }

    /**
     * Get all subjects for a class
     */
    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'TEACHER')")
    public ResponseEntity<List<ClassSubject>> getSubjectsForClass(
            @PathVariable UUID classId,
            Authentication authentication) {
        
        // Validate class ownership
        ownershipValidator.validateClassSchoolAccess(classId, null, authentication);
        
        List<ClassSubject> subjects = classSubjectService.getSubjectsForClass(classId);
        return ResponseEntity.ok(subjects);
    }

    /**
     * Get all classes where a teacher is assigned
     */
    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'TEACHER')")
    public ResponseEntity<List<ClassSubject>> getClassesForTeacher(
            @PathVariable UUID teacherId,
            Authentication authentication) {
        
        // Teachers can view their own assignments
        // Admins can view any teacher's assignments (validated by service)
        
        List<ClassSubject> classes = classSubjectService.getClassesForTeacher(teacherId);
        return ResponseEntity.ok(classes);
    }

    /**
     * Get all classes for a specific subject
     */
    @GetMapping("/subject/{subjectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<ClassSubject>> getClassesForSubject(
            @PathVariable UUID subjectId,
            Authentication authentication) {
        
        List<ClassSubject> classes = classSubjectService.getClassesForSubject(subjectId);
        return ResponseEntity.ok(classes);
    }

    /**
     * Remove a subject from a class
     * Only ADMIN can remove subjects
     */
    @DeleteMapping("/class/{classId}/subject/{subjectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> removeSubjectFromClass(
            @PathVariable UUID classId,
            @PathVariable UUID subjectId,
            Authentication authentication) {
        
        // Validate class ownership
        ownershipValidator.validateClassSchoolAccess(classId, null, authentication);
        
        classSubjectService.removeSubjectFromClass(classId, subjectId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Remove all subjects from a class
     * Only ADMIN can remove all subjects
     */
    @DeleteMapping("/class/{classId}/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> removeAllSubjectsFromClass(
            @PathVariable UUID classId,
            Authentication authentication) {
        
        // Validate class ownership
        ownershipValidator.validateClassSchoolAccess(classId, null, authentication);
        
        classSubjectService.removeAllSubjectsFromClass(classId);
        return ResponseEntity.noContent().build();
    }
}
