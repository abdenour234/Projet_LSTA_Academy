package com.schoolmanagement.controller;

import com.schoolmanagement.entity.DiagnosticSession;
import com.schoolmanagement.repository.DiagnosticSessionRepository;
import com.schoolmanagement.service.OwnershipValidationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/diagnostic-sessions")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
public class DiagnosticSessionController {

    private final DiagnosticSessionRepository diagnosticSessionRepository;
    private final OwnershipValidationService ownershipValidator;

    public DiagnosticSessionController(DiagnosticSessionRepository diagnosticSessionRepository,
                                     OwnershipValidationService ownershipValidator) {
        this.diagnosticSessionRepository = diagnosticSessionRepository;
        this.ownershipValidator = ownershipValidator;
    }

    @GetMapping
    public ResponseEntity<List<DiagnosticSession>> getAllDiagnosticSessions() {
        return ResponseEntity.ok(diagnosticSessionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiagnosticSession> getDiagnosticSession(
            @PathVariable UUID id,
            Authentication authentication) {
        
        DiagnosticSession session = diagnosticSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Diagnostic session not found"));
        
        // Validate user can access this diagnostic session's school
        ownershipValidator.validateDiagnosticSessionAccess(id, authentication);
        
        return ResponseEntity.ok(session);
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<DiagnosticSession>> getDiagnosticSessionsBySchool(
            @PathVariable String schoolId,
            Authentication authentication) {
        
        // Validate user can access this school
        ownershipValidator.validateSchoolAccess(schoolId, authentication);
        
        return ResponseEntity.ok(diagnosticSessionRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<DiagnosticSession>> getDiagnosticSessionsByTeacher(
            @PathVariable UUID teacherId,
            Authentication authentication) {
        
        List<DiagnosticSession> sessions = diagnosticSessionRepository.findByTeacherId(teacherId);
        
        // Validate sessions belong to user's school
        if (!sessions.isEmpty()) {
            ownershipValidator.validateSchoolAccess(sessions.get(0).getSchoolId(), authentication);
        }
        
        return ResponseEntity.ok(sessions);
    }

    @PostMapping
    public ResponseEntity<DiagnosticSession> createDiagnosticSession(
            @RequestBody DiagnosticSession session,
            Authentication authentication) {
        
        // Validate user can create diagnostic sessions in this school
        ownershipValidator.validateSchoolAccess(session.getSchoolId(), authentication);
        
        DiagnosticSession saved = diagnosticSessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiagnosticSession> updateDiagnosticSession(
            @PathVariable UUID id,
            @RequestBody DiagnosticSession session,
            Authentication authentication) {
        
        if (!diagnosticSessionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Validate user can update diagnostic sessions in this school
        ownershipValidator.validateSchoolAccess(session.getSchoolId(), authentication);
        
        session.setId(id);
        DiagnosticSession updated = diagnosticSessionRepository.save(session);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiagnosticSession(
            @PathVariable UUID id,
            Authentication authentication) {
        
        DiagnosticSession session = diagnosticSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Diagnostic session not found"));
        
        // Validate user can delete diagnostic sessions in this school
        ownershipValidator.validateSchoolAccess(session.getSchoolId(), authentication);
        
        diagnosticSessionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
