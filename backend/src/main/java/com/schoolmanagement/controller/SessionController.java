package com.schoolmanagement.controller;

import com.schoolmanagement.entity.TeachingSession;
import com.schoolmanagement.repository.TeachingSessionRepository;
import com.schoolmanagement.service.OwnershipValidationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
public class SessionController {

    private final TeachingSessionRepository sessionRepository;
    private final OwnershipValidationService ownershipValidator;

    public SessionController(TeachingSessionRepository sessionRepository,
                           OwnershipValidationService ownershipValidator) {
        this.sessionRepository = sessionRepository;
        this.ownershipValidator = ownershipValidator;
    }

    @GetMapping
    public ResponseEntity<List<TeachingSession>> getAllSessions() {
        return ResponseEntity.ok(sessionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeachingSession> getSession(
            @PathVariable UUID id,
            Authentication authentication) {
        
        TeachingSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        // Validate user can access this session's school
        ownershipValidator.validateSessionAccess(id, authentication);
        
        return ResponseEntity.ok(session);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeachingSession>> getSessionsByTeacher(
            @PathVariable UUID teacherId,
            Authentication authentication) {
        
        List<TeachingSession> sessions = sessionRepository.findByTeacherId(teacherId);
        
        // Validate each session belongs to user's school (for non-SUPERADMIN)
        if (!sessions.isEmpty()) {
            ownershipValidator.validateSchoolAccess(sessions.get(0).getSchoolId(), authentication);
        }
        
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<TeachingSession>> getSessionsBySchool(
            @PathVariable Long schoolId,
            Authentication authentication) {
        
        // Validate user can access this school
        ownershipValidator.validateSchoolAccess(schoolId, authentication);
        
        return ResponseEntity.ok(sessionRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<TeachingSession>> getSessionsByClass(
            @PathVariable UUID classId,
            Authentication authentication) {
        
        List<TeachingSession> sessions = sessionRepository.findByClassId(classId);
        
        // Validate sessions belong to user's school
        if (!sessions.isEmpty()) {
            ownershipValidator.validateSchoolAccess(sessions.get(0).getSchoolId(), authentication);
        }
        
        return ResponseEntity.ok(sessions);
    }

    @PostMapping
    public ResponseEntity<TeachingSession> createSession(
            @RequestBody TeachingSession session,
            Authentication authentication) {
        
        // Validate user can create sessions in this school
        ownershipValidator.validateSchoolAccess(session.getSchoolId(), authentication);
        
        TeachingSession saved = sessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeachingSession> updateSession(
            @PathVariable UUID id,
            @RequestBody TeachingSession session,
            Authentication authentication) {
        
        if (!sessionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Validate user can update sessions in this school
        ownershipValidator.validateSchoolAccess(session.getSchoolId(), authentication);
        
        session.setId(id);
        TeachingSession updated = sessionRepository.save(session);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable UUID id,
            Authentication authentication) {
        
        TeachingSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        
        // Validate user can delete sessions in this school
        ownershipValidator.validateSchoolAccess(session.getSchoolId(), authentication);
        
        sessionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
