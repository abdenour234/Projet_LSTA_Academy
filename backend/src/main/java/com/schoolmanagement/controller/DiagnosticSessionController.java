package com.schoolmanagement.controller;

import com.schoolmanagement.entity.DiagnosticSession;
import com.schoolmanagement.repository.DiagnosticSessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/diagnostic-sessions")
@CrossOrigin(origins = "*")
public class DiagnosticSessionController {

    private final DiagnosticSessionRepository diagnosticSessionRepository;

    public DiagnosticSessionController(DiagnosticSessionRepository diagnosticSessionRepository) {
        this.diagnosticSessionRepository = diagnosticSessionRepository;
    }

    @GetMapping
    public ResponseEntity<List<DiagnosticSession>> getAllDiagnosticSessions() {
        return ResponseEntity.ok(diagnosticSessionRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiagnosticSession> getDiagnosticSession(@PathVariable UUID id) {
        DiagnosticSession session = diagnosticSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Diagnostic session not found"));
        return ResponseEntity.ok(session);
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<DiagnosticSession>> getDiagnosticSessionsBySchool(@PathVariable String schoolId) {
        return ResponseEntity.ok(diagnosticSessionRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<DiagnosticSession>> getDiagnosticSessionsByTeacher(@PathVariable UUID teacherId) {
        return ResponseEntity.ok(diagnosticSessionRepository.findByTeacherId(teacherId));
    }

    @PostMapping
    public ResponseEntity<DiagnosticSession> createDiagnosticSession(@RequestBody DiagnosticSession session) {
        DiagnosticSession saved = diagnosticSessionRepository.save(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiagnosticSession> updateDiagnosticSession(@PathVariable UUID id, @RequestBody DiagnosticSession session) {
        if (!diagnosticSessionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        session.setId(id);
        DiagnosticSession updated = diagnosticSessionRepository.save(session);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDiagnosticSession(@PathVariable UUID id) {
        if (!diagnosticSessionRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        diagnosticSessionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
