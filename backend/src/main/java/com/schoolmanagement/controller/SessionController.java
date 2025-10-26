package com.schoolmanagement.controller;

import com.schoolmanagement.entity.TeachingSession;
import com.schoolmanagement.repository.TeachingSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
public class SessionController {

    private final TeachingSessionRepository sessionRepository;

    public SessionController(TeachingSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @GetMapping
    public ResponseEntity<List<TeachingSession>> getAllSessions() {
        return ResponseEntity.ok(sessionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeachingSession> getSession(@PathVariable UUID id) {
        TeachingSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session not found"));
        return ResponseEntity.ok(session);
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeachingSession>> getSessionsByTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(sessionRepository.findByTeacherId(teacherId));
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<TeachingSession>> getSessionsBySchool(@PathVariable String schoolId) {
        return ResponseEntity.ok(sessionRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<TeachingSession>> getSessionsByClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(sessionRepository.findByClassId(classId));
    }

    @PostMapping
    public ResponseEntity<TeachingSession> createSession(@RequestBody TeachingSession session) {
        TeachingSession saved = sessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeachingSession> updateSession(@PathVariable UUID id, @RequestBody TeachingSession session) {
        if (!sessionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        session.setId(id);
        TeachingSession updated = sessionRepository.save(session);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        if (!sessionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        sessionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
