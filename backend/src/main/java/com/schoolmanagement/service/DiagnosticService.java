package com.schoolmanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schoolmanagement.dto.*;
import com.schoolmanagement.entity.DiagnosticResult;
import com.schoolmanagement.entity.DiagnosticSession;
import com.schoolmanagement.entity.DiagnosticStudent;
import com.schoolmanagement.entity.Student;
import com.schoolmanagement.repository.DiagnosticResultRepository;
import com.schoolmanagement.repository.DiagnosticSessionRepository;
import com.schoolmanagement.repository.DiagnosticStudentRepository;
import com.schoolmanagement.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiagnosticService {
    
    private final DiagnosticSessionRepository sessionRepository;
    private final DiagnosticStudentRepository diagnosticStudentRepository;
    private final DiagnosticResultRepository resultRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;
    
    @Transactional
    public DiagnosticSessionResponse createSession(CreateDiagnosticSessionRequest request) {
        // Créer la session
        DiagnosticSession session = new DiagnosticSession();
        session.setSchoolId(request.getSchoolId());
        session.setTeacherId(request.getTeacherId());
        session.setDiagnosticType(request.getDiagnosticType());
        session.setGradeLevel(request.getGradeLevel());
        session.setClassName(request.getClassName());
        session.setClassId(request.getClassId());
        session.setSessionDate(LocalDateTime.now());
        session.setStatus("pending");
        
        // Récupérer les étudiants de la classe
        List<Student> students = studentRepository.findByClassId(request.getClassId());
        session.setTotalStudents(students.size());
        
        DiagnosticSession savedSession = sessionRepository.save(session);
        
        // Créer les entrées d'étudiants pour cette session
        int order = 1;
        for (Student student : students) {
            DiagnosticStudent diagStudent = new DiagnosticStudent();
            diagStudent.setSessionId(savedSession.getId());
            diagStudent.setStudentId(student.getId());
            diagStudent.setStudentName(student.getFirstName() + " " + student.getLastName());
            diagStudent.setStudentOrder(order++);
            diagnosticStudentRepository.save(diagStudent);
        }
        
        return mapToSessionResponse(savedSession);
    }
    
    public DiagnosticSessionResponse getSession(UUID sessionId) {
        DiagnosticSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Session not found"));
        return mapToSessionResponse(session);
    }
    
    public List<DiagnosticSessionResponse> getSessionsByTeacher(UUID teacherId) {
        return sessionRepository.findByTeacherIdOrderByCreatedAtDesc(teacherId)
            .stream()
            .map(this::mapToSessionResponse)
            .collect(Collectors.toList());
    }
    
    public List<DiagnosticSessionResponse> getSessionsBySchool(Long schoolId) {
        return sessionRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId)
            .stream()
            .map(this::mapToSessionResponse)
            .collect(Collectors.toList());
    }
    
    public List<DiagnosticStudentResponse> getSessionStudents(UUID sessionId) {
        return diagnosticStudentRepository.findBySessionIdOrderByStudentOrder(sessionId)
            .stream()
            .map(this::mapToStudentResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public void saveResults(SaveDiagnosticResultsRequest request) {
        // Vérifier que la session existe
        DiagnosticSession session = sessionRepository.findById(request.getSessionId())
            .orElseThrow(() -> new RuntimeException("Session not found"));
        
        // Supprimer les anciens résultats s'ils existent
        resultRepository.deleteBySessionId(request.getSessionId());
        
        // Sauvegarder les nouveaux résultats
        for (SaveDiagnosticResultsRequest.StudentResult studentResult : request.getResults()) {
            DiagnosticResult result = new DiagnosticResult();
            result.setSessionId(request.getSessionId());
            result.setStudentId(studentResult.getStudentId());
            result.setCriteriaData(objectMapper.valueToTree(studentResult.getCriteriaData()));
            result.setFinalResult(studentResult.getFinalResult());
            resultRepository.save(result);
        }
        
        // Mettre à jour le statut de la session
        session.setStatus("completed");
        sessionRepository.save(session);
    }
    
    public List<DiagnosticResultResponse> getResults(UUID sessionId) {
        return resultRepository.findBySessionId(sessionId)
            .stream()
            .map(this::mapToResultResponse)
            .collect(Collectors.toList());
    }
    
    public DiagnosticStatsResponse getStats(UUID sessionId) {
        List<DiagnosticResult> results = resultRepository.findBySessionId(sessionId);
        List<DiagnosticStudent> students = diagnosticStudentRepository.findBySessionIdOrderByStudentOrder(sessionId);
        
        // Distribution des résultats finaux
        Map<String, Integer> resultDistribution = new HashMap<>();
        for (DiagnosticResult result : results) {
            String finalResult = result.getFinalResult();
            resultDistribution.put(finalResult, resultDistribution.getOrDefault(finalResult, 0) + 1);
        }
        
        // Statistiques par critère
        Map<String, Map<String, Integer>> criteriaStats = new HashMap<>();
        for (DiagnosticResult result : results) {
            JsonNode criteriaData = result.getCriteriaData();
            criteriaData.fields().forEachRemaining(entry -> {
                String criteriaId = entry.getKey();
                String value = entry.getValue().asText();
                
                criteriaStats.putIfAbsent(criteriaId, new HashMap<>());
                Map<String, Integer> criteriaMap = criteriaStats.get(criteriaId);
                criteriaMap.put(value, criteriaMap.getOrDefault(value, 0) + 1);
            });
        }
        
        // Résultats détaillés par étudiant
        List<DiagnosticStatsResponse.StudentDetailResult> studentResults = new ArrayList<>();
        for (DiagnosticStudent student : students) {
            DiagnosticResult result = results.stream()
                .filter(r -> r.getStudentId().equals(student.getId()))
                .findFirst()
                .orElse(null);
            
            if (result != null) {
                DiagnosticStatsResponse.StudentDetailResult detail = new DiagnosticStatsResponse.StudentDetailResult();
                detail.setStudentName(student.getStudentName());
                detail.setCriteriaData(objectMapper.convertValue(result.getCriteriaData(), Map.class));
                detail.setFinalResult(result.getFinalResult());
                studentResults.add(detail);
            }
        }
        
        DiagnosticStatsResponse stats = new DiagnosticStatsResponse();
        stats.setResultDistribution(resultDistribution);
        stats.setCriteriaStats(criteriaStats);
        stats.setStudentResults(studentResults);
        
        return stats;
    }
    
    @Transactional
    public void deleteSession(UUID sessionId) {
        diagnosticStudentRepository.deleteBySessionId(sessionId);
        resultRepository.deleteBySessionId(sessionId);
        sessionRepository.deleteById(sessionId);
    }
    
    // Méthodes de mapping
    private DiagnosticSessionResponse mapToSessionResponse(DiagnosticSession session) {
        DiagnosticSessionResponse response = new DiagnosticSessionResponse();
        response.setId(session.getId());
        response.setSchoolId(session.getSchoolId());
        response.setTeacherId(session.getTeacherId());
        response.setDiagnosticType(session.getDiagnosticType());
        response.setGradeLevel(session.getGradeLevel());
        response.setClassName(session.getClassName());
        response.setClassId(session.getClassId());
        response.setTotalStudents(session.getTotalStudents());
        response.setStatus(session.getStatus());
        response.setSessionDate(session.getSessionDate());
        response.setCreatedAt(session.getCreatedAt());
        return response;
    }
    
    private DiagnosticStudentResponse mapToStudentResponse(DiagnosticStudent student) {
        DiagnosticStudentResponse response = new DiagnosticStudentResponse();
        response.setId(student.getId());
        response.setSessionId(student.getSessionId());
        response.setStudentId(student.getStudentId());
        response.setStudentName(student.getStudentName());
        response.setStudentOrder(student.getStudentOrder());
        return response;
    }
    
    private DiagnosticResultResponse mapToResultResponse(DiagnosticResult result) {
        DiagnosticResultResponse response = new DiagnosticResultResponse();
        response.setId(result.getId());
        response.setSessionId(result.getSessionId());
        response.setStudentId(result.getStudentId());
        response.setCriteriaData(result.getCriteriaData());
        response.setFinalResult(result.getFinalResult());
        response.setCreatedAt(result.getCreatedAt());
        return response;
    }
}