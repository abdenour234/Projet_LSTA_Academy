package com.schoolmanagement.service;

import com.schoolmanagement.dto.TeacherAttendanceDTO;
import com.schoolmanagement.dto.TeacherAttendanceRequest;
import com.schoolmanagement.dto.TeacherAttendanceStats;
import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.entity.Teacher;
import com.schoolmanagement.entity.TeacherAttendance;
import com.schoolmanagement.entity.TeacherAttendance.AttendanceType;
import com.schoolmanagement.repository.ClasseRepository;
import com.schoolmanagement.repository.TeacherAttendanceRepository;
import com.schoolmanagement.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing teacher attendance (absences and retards)
 * AC-02-03: Gestion des absences et retards des enseignants
 */
@Service
@Transactional
public class TeacherAttendanceService {

    @Autowired
    private TeacherAttendanceRepository attendanceRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private ClasseRepository classeRepository;

    /**
     * Create a new attendance record
     */
    public TeacherAttendanceDTO createAttendance(TeacherAttendanceRequest request, Long schoolId, UUID recordedBy) {
        // Validate teacher exists
        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found with ID: " + request.getTeacherId()));

        // Verify teacher belongs to the school
        if (!teacher.getSchoolId().equals(schoolId)) {
            throw new RuntimeException("Teacher does not belong to this school");
        }

        // Check for duplicate entry (same teacher, same date, same type)
        if (attendanceRepository.existsByTeacherIdAndEventDateAndType(
                request.getTeacherId(), request.getEventDate(), request.getType())) {
            throw new RuntimeException("An attendance record already exists for this teacher on this date with the same type");
        }

        // Create attendance entity
        TeacherAttendance attendance = new TeacherAttendance();
        attendance.setTeacherId(request.getTeacherId());
        attendance.setSchoolId(schoolId);
        attendance.setType(request.getType());
        attendance.setEventDate(request.getEventDate());
        attendance.setClassId(request.getClassId());
        attendance.setReason(request.getReason());
        attendance.setIsJustified(request.getIsJustified() != null ? request.getIsJustified() : false);
        attendance.setDurationMinutes(request.getDurationMinutes());
        attendance.setAdminNotes(request.getAdminNotes());
        attendance.setRecordedBy(recordedBy);

        TeacherAttendance saved = attendanceRepository.save(attendance);
        return convertToDTO(saved);
    }

    /**
     * Update an existing attendance record
     */
    public TeacherAttendanceDTO updateAttendance(UUID id, TeacherAttendanceRequest request, Long schoolId) {
        TeacherAttendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found with ID: " + id));

        // Verify belongs to school
        if (!attendance.getSchoolId().equals(schoolId)) {
            throw new RuntimeException("Attendance record does not belong to this school");
        }

        // Update fields
        attendance.setType(request.getType());
        attendance.setEventDate(request.getEventDate());
        attendance.setClassId(request.getClassId());
        attendance.setReason(request.getReason());
        attendance.setIsJustified(request.getIsJustified() != null ? request.getIsJustified() : attendance.getIsJustified());
        attendance.setDurationMinutes(request.getDurationMinutes());
        attendance.setAdminNotes(request.getAdminNotes());

        TeacherAttendance updated = attendanceRepository.save(attendance);
        return convertToDTO(updated);
    }

    /**
     * Delete an attendance record
     */
    public void deleteAttendance(UUID id, Long schoolId) {
        TeacherAttendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Attendance record not found with ID: " + id));

        if (!attendance.getSchoolId().equals(schoolId)) {
            throw new RuntimeException("Attendance record does not belong to this school");
        }

        attendanceRepository.delete(attendance);
    }

    /**
     * Get all attendance records for a school
     */
    @Transactional(readOnly = true)
    public List<TeacherAttendanceDTO> getAllBySchool(Long schoolId) {
        List<TeacherAttendance> attendances = attendanceRepository.findBySchoolIdOrderByEventDateDesc(schoolId);
        return attendances.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get attendance records for a school within a date range
     */
    @Transactional(readOnly = true)
    public List<TeacherAttendanceDTO> getBySchoolAndDateRange(Long schoolId, LocalDate startDate, LocalDate endDate) {
        List<TeacherAttendance> attendances = attendanceRepository.findBySchoolIdAndDateRange(schoolId, startDate, endDate);
        return attendances.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get attendance records for a specific teacher
     */
    @Transactional(readOnly = true)
    public List<TeacherAttendanceDTO> getByTeacher(UUID teacherId) {
        List<TeacherAttendance> attendances = attendanceRepository.findByTeacherIdOrderByEventDateDesc(teacherId);
        return attendances.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get statistics for a specific teacher
     */
    @Transactional(readOnly = true)
    public TeacherAttendanceStats getTeacherStats(UUID teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found with ID: " + teacherId));

        TeacherAttendanceStats stats = new TeacherAttendanceStats();
        stats.setTeacherId(teacherId);
        stats.setTeacherName(teacher.getProfile() != null ? teacher.getProfile().getFullName() : "Unknown");
        stats.setTeacherSpecialty(teacher.getSpecialty());

        // Count statistics
        stats.setTotalAbsences(attendanceRepository.countAbsencesByTeacherId(teacherId));
        stats.setTotalRetards(attendanceRepository.countRetardsByTeacherId(teacherId));
        stats.setJustifiedAbsences(attendanceRepository.countJustifiedAbsencesByTeacherId(teacherId));
        stats.setUnjustifiedAbsences(attendanceRepository.countUnjustifiedAbsencesByTeacherId(teacherId));
        stats.setJustifiedRetards(attendanceRepository.countJustifiedRetardsByTeacherId(teacherId));
        stats.setUnjustifiedRetards(attendanceRepository.countUnjustifiedRetardsByTeacherId(teacherId));

        // Get monthly stats for current year
        int currentYear = Year.now().getValue();
        List<Object[]> monthlyData = attendanceRepository.getMonthlyStatsByTeacherAndYear(teacherId, currentYear);
        List<TeacherAttendanceStats.MonthlyStats> monthlyStats = new ArrayList<>();
        for (Object[] row : monthlyData) {
            TeacherAttendanceStats.MonthlyStats monthly = new TeacherAttendanceStats.MonthlyStats();
            monthly.setMonth((String) row[0]);
            monthly.setAbsences(((Number) row[1]).longValue());
            monthly.setRetards(((Number) row[2]).longValue());
            monthlyStats.add(monthly);
        }
        stats.setMonthlyStats(monthlyStats);

        // Get recent events
        List<TeacherAttendance> recentEvents = attendanceRepository.findTop10ByTeacherIdOrderByEventDateDesc(teacherId);
        stats.setRecentEvents(recentEvents.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList()));

        return stats;
    }

    /**
     * Get statistics for all teachers in a school
     */
    @Transactional(readOnly = true)
    public List<TeacherAttendanceStats> getAllTeachersStats(Long schoolId) {
        List<Teacher> teachers = teacherRepository.findBySchoolId(schoolId);
        return teachers.stream()
                .map(teacher -> getTeacherStats(teacher.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Get attendance records by type (ABSENCE or RETARD)
     */
    @Transactional(readOnly = true)
    public List<TeacherAttendanceDTO> getBySchoolAndType(Long schoolId, AttendanceType type) {
        List<TeacherAttendance> attendances = attendanceRepository.findBySchoolIdAndTypeOrderByEventDateDesc(schoolId, type);
        return attendances.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get attendance records for a specific class
     */
    @Transactional(readOnly = true)
    public List<TeacherAttendanceDTO> getByClass(UUID classId) {
        List<TeacherAttendance> attendances = attendanceRepository.findByClassIdOrderByEventDateDesc(classId);
        return attendances.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert TeacherAttendance entity to DTO
     */
    private TeacherAttendanceDTO convertToDTO(TeacherAttendance attendance) {
        TeacherAttendanceDTO dto = new TeacherAttendanceDTO();
        dto.setId(attendance.getId());
        dto.setTeacherId(attendance.getTeacherId());
        dto.setSchoolId(attendance.getSchoolId());
        dto.setType(attendance.getType());
        dto.setEventDate(attendance.getEventDate());
        dto.setClassId(attendance.getClassId());
        dto.setReason(attendance.getReason());
        dto.setIsJustified(attendance.getIsJustified());
        dto.setDurationMinutes(attendance.getDurationMinutes());
        dto.setAdminNotes(attendance.getAdminNotes());
        dto.setRecordedBy(attendance.getRecordedBy());
        dto.setCreatedAt(attendance.getCreatedAt());
        dto.setUpdatedAt(attendance.getUpdatedAt());

        // Populate computed fields
        if (attendance.getTeacher() != null && attendance.getTeacher().getProfile() != null) {
            dto.setTeacherName(attendance.getTeacher().getProfile().getFullName());
            dto.setTeacherSpecialty(attendance.getTeacher().getSpecialty());
        }

        if (attendance.getClasse() != null) {
            dto.setClassName(attendance.getClasse().getName());
        }

        return dto;
    }
}
