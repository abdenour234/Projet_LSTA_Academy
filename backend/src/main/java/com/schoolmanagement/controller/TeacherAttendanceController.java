package com.schoolmanagement.controller;

import com.schoolmanagement.dto.TeacherAttendanceDTO;
import com.schoolmanagement.dto.TeacherAttendanceRequest;
import com.schoolmanagement.dto.TeacherAttendanceStats;
import com.schoolmanagement.entity.TeacherAttendance.AttendanceType;
import com.schoolmanagement.service.TeacherAttendanceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Teacher Attendance Management
 * AC-02-03: Gestion des absences et retards des enseignants
 * 
 * Endpoints for:
 * - Creating, updating, and deleting attendance records
 * - Retrieving attendance data with filters
 * - Getting statistics and visualizations
 */
@RestController
@RequestMapping("/api/teacher-attendance")
@CrossOrigin(origins = "*")
public class TeacherAttendanceController {

    @Autowired
    private TeacherAttendanceService attendanceService;

    /**
     * Create a new attendance record (absence or retard)
     * POST /api/teacher-attendance
     */
    @PostMapping
    public ResponseEntity<TeacherAttendanceDTO> createAttendance(
            @Valid @RequestBody TeacherAttendanceRequest request,
            @RequestParam Long schoolId,
            @RequestParam UUID recordedBy) {
        try {
            TeacherAttendanceDTO created = attendanceService.createAttendance(request, schoolId, recordedBy);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Update an existing attendance record
     * PUT /api/teacher-attendance/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<TeacherAttendanceDTO> updateAttendance(
            @PathVariable UUID id,
            @Valid @RequestBody TeacherAttendanceRequest request,
            @RequestParam Long schoolId) {
        try {
            TeacherAttendanceDTO updated = attendanceService.updateAttendance(id, request, schoolId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Delete an attendance record
     * DELETE /api/teacher-attendance/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(
            @PathVariable UUID id,
            @RequestParam Long schoolId) {
        try {
            attendanceService.deleteAttendance(id, schoolId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Get all attendance records for a school
     * GET /api/teacher-attendance/school/{schoolId}
     */
    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<TeacherAttendanceDTO>> getAllBySchool(@PathVariable Long schoolId) {
        List<TeacherAttendanceDTO> attendances = attendanceService.getAllBySchool(schoolId);
        return ResponseEntity.ok(attendances);
    }

    /**
     * Get attendance records for a school within a date range
     * GET /api/teacher-attendance/school/{schoolId}/range
     */
    @GetMapping("/school/{schoolId}/range")
    public ResponseEntity<List<TeacherAttendanceDTO>> getBySchoolAndDateRange(
            @PathVariable Long schoolId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<TeacherAttendanceDTO> attendances = attendanceService.getBySchoolAndDateRange(schoolId, startDate, endDate);
        return ResponseEntity.ok(attendances);
    }

    /**
     * Get attendance records for a specific teacher
     * GET /api/teacher-attendance/teacher/{teacherId}
     */
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TeacherAttendanceDTO>> getByTeacher(@PathVariable UUID teacherId) {
        List<TeacherAttendanceDTO> attendances = attendanceService.getByTeacher(teacherId);
        return ResponseEntity.ok(attendances);
    }

    /**
     * Get statistics for a specific teacher
     * GET /api/teacher-attendance/teacher/{teacherId}/stats
     */
    @GetMapping("/teacher/{teacherId}/stats")
    public ResponseEntity<TeacherAttendanceStats> getTeacherStats(@PathVariable UUID teacherId) {
        try {
            TeacherAttendanceStats stats = attendanceService.getTeacherStats(teacherId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get statistics for all teachers in a school
     * GET /api/teacher-attendance/school/{schoolId}/stats
     */
    @GetMapping("/school/{schoolId}/stats")
    public ResponseEntity<List<TeacherAttendanceStats>> getAllTeachersStats(@PathVariable Long schoolId) {
        List<TeacherAttendanceStats> stats = attendanceService.getAllTeachersStats(schoolId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get attendance records by type (ABSENCE or RETARD)
     * GET /api/teacher-attendance/school/{schoolId}/type/{type}
     */
    @GetMapping("/school/{schoolId}/type/{type}")
    public ResponseEntity<List<TeacherAttendanceDTO>> getBySchoolAndType(
            @PathVariable Long schoolId,
            @PathVariable AttendanceType type) {
        List<TeacherAttendanceDTO> attendances = attendanceService.getBySchoolAndType(schoolId, type);
        return ResponseEntity.ok(attendances);
    }

    /**
     * Get attendance records for a specific class
     * GET /api/teacher-attendance/class/{classId}
     */
    @GetMapping("/class/{classId}")
    public ResponseEntity<List<TeacherAttendanceDTO>> getByClass(@PathVariable UUID classId) {
        List<TeacherAttendanceDTO> attendances = attendanceService.getByClass(classId);
        return ResponseEntity.ok(attendances);
    }
}
