package com.schoolmanagement.controller;

import com.schoolmanagement.entity.TeachingSession;
import com.schoolmanagement.repository.TeachingSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teaching-sessions")
@RequiredArgsConstructor
public class TeachingSessionController {

    private final TeachingSessionRepository teachingSessionRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<TeachingSession>> getAllSessions() {
        return ResponseEntity.ok(teachingSessionRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<TeachingSession> getSession(@PathVariable UUID id) {
        TeachingSession session = teachingSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Teaching session not found"));
        return ResponseEntity.ok(session);
    }

    @GetMapping("/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<TeachingSession>> getSessionsByTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(teachingSessionRepository.findByTeacherId(teacherId));
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<TeachingSession>> getSessionsBySchool(@PathVariable String schoolId) {
        return ResponseEntity.ok(teachingSessionRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<TeachingSession>> getSessionsByClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(teachingSessionRepository.findByClassId(classId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<TeachingSession> createSession(@RequestBody TeachingSession session) {
        session.setId(UUID.randomUUID());
        TeachingSession saved = teachingSessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<TeachingSession> updateSession(@PathVariable UUID id, @RequestBody TeachingSession session) {
        if (!teachingSessionRepository.existsById(id)) {
            throw new RuntimeException("Teaching session not found");
        }
        session.setId(id);
        TeachingSession updated = teachingSessionRepository.save(session);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        if (!teachingSessionRepository.existsById(id)) {
            throw new RuntimeException("Teaching session not found");
        }
        teachingSessionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
