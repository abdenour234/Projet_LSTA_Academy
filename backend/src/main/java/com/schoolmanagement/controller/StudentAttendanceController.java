package com.schoolmanagement.controller;

import com.schoolmanagement.dto.StudentAttendanceDTO;
import com.schoolmanagement.dto.StudentAttendanceRequest;
import com.schoolmanagement.dto.StudentAttendanceStats;
import com.schoolmanagement.service.StudentAttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/student-attendance")
@RequiredArgsConstructor
public class StudentAttendanceController {

    private final StudentAttendanceService attendanceService;

    /**
     * GET /api/student-attendance/classes/{schoolId}/{teacherId}
     * Récupérer les classes d'un enseignant (format simplifié)
     */
    @GetMapping("/classes/{schoolId}/{teacherId}")
    public ResponseEntity<List<Map<String, String>>> getTeacherClasses(
        @PathVariable Long schoolId,
        @PathVariable UUID teacherId
    ) {
        log.info("GET /api/student-attendance/classes/{}/{}", schoolId, teacherId);
        try {
            List<Map<String, String>> classes = attendanceService.getTeacherClasses(schoolId, teacherId);
            log.info("Returning {} classes", classes.size());
            return ResponseEntity.ok(classes);
        } catch (RuntimeException e) {
            log.error("Error getting teacher classes: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    /**
     * GET /api/student-attendance/students/{schoolId}/{teacherId}/{classId}
     * Récupérer les étudiants d'une classe (format simplifié)
     */
    @GetMapping("/students/{schoolId}/{teacherId}/{classId}")
    public ResponseEntity<List<Map<String, String>>> getClassStudents(
        @PathVariable Long schoolId,
        @PathVariable UUID teacherId,
        @PathVariable UUID classId
    ) {
        log.info("GET /api/student-attendance/students/{}/{}/{}", schoolId, teacherId, classId);
        try {
            List<Map<String, String>> students = attendanceService.getClassStudents(schoolId, teacherId, classId);
            log.info("Returning {} students", students.size());
            return ResponseEntity.ok(students);
        } catch (RuntimeException e) {
            log.error("Error getting class students: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    /**
     * POST /api/student-attendance/bulk/{teacherId}
     * Enregistrer les absences en masse pour une date
     */
    @PostMapping("/bulk/{teacherId}")
    public ResponseEntity<?> recordBulkAbsences(
        @PathVariable UUID teacherId,
        @RequestBody StudentAttendanceRequest request
    ) {
        log.info("POST /api/student-attendance/bulk/{}", teacherId);
        log.info("Request: schoolId={}, classId={}, date={}, absentStudents={}", 
                 request.getSchoolId(), request.getClassId(), 
                 request.getEventDate(), request.getAbsentStudents().size());
        try {
            List<StudentAttendanceDTO> records = attendanceService.recordBulkAbsences(teacherId, request);
            log.info("Successfully recorded {} absences", records.size());
            return ResponseEntity.ok(Map.of(
                "message", "Absences enregistrées avec succès",
                "count", records.size(),
                "records", records
            ));
        } catch (RuntimeException e) {
            log.error("Error recording bulk absences: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    /**
     * GET /api/student-attendance/{schoolId}/{teacherId}/{classId}
     * Récupérer les absences d'une classe pour une période
     */
    @GetMapping("/{schoolId}/{teacherId}/{classId}")
    public ResponseEntity<List<StudentAttendanceDTO>> getClassAttendance(
        @PathVariable Long schoolId,
        @PathVariable UUID teacherId,
        @PathVariable UUID classId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        log.info("GET /api/student-attendance/{}/{}/{}?startDate={}&endDate={}", 
                 schoolId, teacherId, classId, startDate, endDate);
        try {
            List<StudentAttendanceDTO> records = attendanceService.getClassAttendance(
                schoolId, teacherId, classId, startDate, endDate
            );
            log.info("Returning {} attendance records", records.size());
            return ResponseEntity.ok(records);
        } catch (RuntimeException e) {
            log.error("Error getting class attendance: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    /**
     * GET /api/student-attendance/stats/{schoolId}/{teacherId}/{classId}
     * Récupérer les statistiques d'une classe
     */
    @GetMapping("/stats/{schoolId}/{teacherId}/{classId}")
    public ResponseEntity<List<StudentAttendanceStats>> getClassAttendanceStats(
        @PathVariable Long schoolId,
        @PathVariable UUID teacherId,
        @PathVariable UUID classId
    ) {
        log.info("GET /api/student-attendance/stats/{}/{}/{}", schoolId, teacherId, classId);
        try {
            List<StudentAttendanceStats> stats = attendanceService.getClassAttendanceStats(
                schoolId, teacherId, classId
            );
            log.info("Returning stats for {} students", stats.size());
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            log.error("Error getting attendance stats: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    /**
     * PATCH /api/student-attendance/{attendanceId}/justification/{teacherId}
     * Modifier le statut de justification d'une absence
     */
    @PatchMapping("/{attendanceId}/justification/{teacherId}")
    public ResponseEntity<?> updateJustificationStatus(
        @PathVariable UUID attendanceId,
        @PathVariable UUID teacherId,
        @RequestParam Boolean isJustified,
        @RequestParam(required = false) String teacherNotes
    ) {
        log.info("PATCH /api/student-attendance/{}/justification/{}", attendanceId, teacherId);
        try {
            StudentAttendanceDTO updated = attendanceService.updateJustificationStatus(
                attendanceId, teacherId, isJustified, teacherNotes
            );
            log.info("Successfully updated justification status");
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating justification: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", e.getMessage()
            ));
        }
    }

    /**
     * DELETE /api/student-attendance/{attendanceId}/{teacherId}
     * Supprimer une absence
     */
    @DeleteMapping("/{attendanceId}/{teacherId}")
    public ResponseEntity<?> deleteAttendance(
        @PathVariable UUID attendanceId,
        @PathVariable UUID teacherId
    ) {
        log.info("DELETE /api/student-attendance/{}/{}", attendanceId, teacherId);
        try {
            attendanceService.deleteAttendance(attendanceId, teacherId);
            log.info("Successfully deleted attendance record");
            return ResponseEntity.ok(Map.of(
                "message", "Absence supprimée avec succès"
            ));
        } catch (RuntimeException e) {
            log.error("Error deleting attendance: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
}