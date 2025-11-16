package com.schoolmanagement.controller;

import com.schoolmanagement.dto.*;
import com.schoolmanagement.service.DiagnosticService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/diagnostics")
@RequiredArgsConstructor
public class DiagnosticController {
    
    private final DiagnosticService diagnosticService;
    
    /**
     * Créer une nouvelle session de diagnostic
     * POST /api/diagnostics/sessions
     */
    @PostMapping("/sessions")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<DiagnosticSessionResponse> createSession(
            @RequestBody CreateDiagnosticSessionRequest request) {
        DiagnosticSessionResponse response = diagnosticService.createSession(request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Récupérer une session par ID
     * GET /api/diagnostics/sessions/{sessionId}
     */
    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<DiagnosticSessionResponse> getSession(@PathVariable UUID sessionId) {
        DiagnosticSessionResponse response = diagnosticService.getSession(sessionId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Récupérer toutes les sessions d'un enseignant
     * GET /api/diagnostics/sessions/teacher/{teacherId}
     */
    @GetMapping("/sessions/teacher/{teacherId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<DiagnosticSessionResponse>> getSessionsByTeacher(
            @PathVariable UUID teacherId) {
        List<DiagnosticSessionResponse> sessions = diagnosticService.getSessionsByTeacher(teacherId);
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Récupérer toutes les sessions d'une école
     * GET /api/diagnostics/sessions/school/{schoolId}
     */
    @GetMapping("/sessions/school/{schoolId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<DiagnosticSessionResponse>> getSessionsBySchool(
            @PathVariable Long schoolId) {
        List<DiagnosticSessionResponse> sessions = diagnosticService.getSessionsBySchool(schoolId);
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Récupérer les étudiants d'une session
     * GET /api/diagnostics/sessions/{sessionId}/students
     */
    @GetMapping("/sessions/{sessionId}/students")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<DiagnosticStudentResponse>> getSessionStudents(
            @PathVariable UUID sessionId) {
        List<DiagnosticStudentResponse> students = diagnosticService.getSessionStudents(sessionId);
        return ResponseEntity.ok(students);
    }
    
    /**
     * Sauvegarder les résultats d'un diagnostic
     * POST /api/diagnostics/results
     */
    @PostMapping("/results")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Void> saveResults(@RequestBody SaveDiagnosticResultsRequest request) {
        diagnosticService.saveResults(request);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Récupérer les résultats d'une session
     * GET /api/diagnostics/sessions/{sessionId}/results
     */
    @GetMapping("/sessions/{sessionId}/results")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<List<DiagnosticResultResponse>> getResults(@PathVariable UUID sessionId) {
        List<DiagnosticResultResponse> results = diagnosticService.getResults(sessionId);
        return ResponseEntity.ok(results);
    }
    
    /**
     * Récupérer les statistiques d'une session
     * GET /api/diagnostics/sessions/{sessionId}/stats
     */
    @GetMapping("/sessions/{sessionId}/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<DiagnosticStatsResponse> getStats(@PathVariable UUID sessionId) {
        DiagnosticStatsResponse stats = diagnosticService.getStats(sessionId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Supprimer une session de diagnostic
     * DELETE /api/diagnostics/sessions/{sessionId}
     */
    @DeleteMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID sessionId) {
        diagnosticService.deleteSession(sessionId);
        return ResponseEntity.ok().build();
    }
}