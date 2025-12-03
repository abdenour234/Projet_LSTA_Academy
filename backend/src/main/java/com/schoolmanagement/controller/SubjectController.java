package com.schoolmanagement.controller;

import com.schoolmanagement.dto.SubjectDTO;
import com.schoolmanagement.entity.Subject;
import com.schoolmanagement.service.OwnershipValidationService;
import com.schoolmanagement.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * SubjectController
 * REST API endpoints for subject management.
 * 
 * Sprint 1 - Ticket 8: Subject REST API
 * Provides endpoints for:
 * - Creating and updating subjects
 * - Retrieving subjects by school
 * - Deleting subjects
 */
@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "*")
public class SubjectController {

    private final SubjectService subjectService;
    private final OwnershipValidationService ownershipValidator;

    public SubjectController(SubjectService subjectService, 
                            OwnershipValidationService ownershipValidator) {
        this.subjectService = subjectService;
        this.ownershipValidator = ownershipValidator;
    }

    /**
     * Create a new subject
     * Only ADMIN can create subjects
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Subject> createSubject(
            @Valid @RequestBody SubjectDTO dto,
            Authentication authentication) {
        
        // Validate user can access this school
        ownershipValidator.validateSchoolAccess(dto.getSchoolId(), authentication);
        
        Subject subject = subjectService.createSubject(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(subject);
    }

    /**
     * Update an existing subject
     * Only ADMIN can update subjects
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Subject> updateSubject(
            @PathVariable UUID id,
            @Valid @RequestBody SubjectDTO dto,
            Authentication authentication) {
        
        // Get existing subject to verify school access
        Subject existing = subjectService.getSubjectById(id);
        ownershipValidator.validateSchoolAccess(existing.getSchoolId(), authentication);
        
        Subject subject = subjectService.updateSubject(id, dto);
        return ResponseEntity.ok(subject);
    }

    /**
     * Get all subjects for a school
     */
    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'TEACHER')")
    public ResponseEntity<List<Subject>> getSubjectsBySchool(
            @PathVariable Long schoolId,
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            Authentication authentication) {
        
        // Validate user can access this school
        ownershipValidator.validateSchoolAccess(schoolId, authentication);
        
        List<Subject> subjects = activeOnly 
            ? subjectService.getActiveSubjectsBySchool(schoolId)
            : subjectService.getSubjectsBySchool(schoolId);
            
        return ResponseEntity.ok(subjects);
    }

    /**
     * Get a specific subject by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN', 'TEACHER')")
    public ResponseEntity<Subject> getSubject(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Subject subject = subjectService.getSubjectById(id);
        ownershipValidator.validateSchoolAccess(subject.getSchoolId(), authentication);
        
        return ResponseEntity.ok(subject);
    }

    /**
     * Toggle subject active status
     * Only ADMIN can toggle status
     */
    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Subject> toggleSubjectStatus(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Subject existing = subjectService.getSubjectById(id);
        ownershipValidator.validateSchoolAccess(existing.getSchoolId(), authentication);
        
        Subject subject = subjectService.toggleSubjectStatus(id);
        return ResponseEntity.ok(subject);
    }

    /**
     * Delete a subject
     * Only ADMIN can delete subjects
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Subject existing = subjectService.getSubjectById(id);
        ownershipValidator.validateSchoolAccess(existing.getSchoolId(), authentication);
        
        subjectService.deleteSubject(id);
        return ResponseEntity.noContent().build();
    }

    
}
