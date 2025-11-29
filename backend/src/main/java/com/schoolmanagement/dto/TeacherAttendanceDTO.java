package com.schoolmanagement.dto;

import com.schoolmanagement.entity.TeacherAttendance.AttendanceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for creating/updating teacher attendance records
 * AC-02-03: Gestion des absences et retards des enseignants
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherAttendanceDTO {
    
    private UUID id;

    @NotNull(message = "Teacher ID is required")
    private UUID teacherId;

    @NotNull(message = "School ID is required")
    private Long schoolId;

    @NotNull(message = "Attendance type is required")
    private AttendanceType type;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    private UUID classId;

    private String reason;

    private Boolean isJustified = false;

    private Integer durationMinutes;

    private String adminNotes;

    private UUID recordedBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Computed fields for display (populated from Teacher entity)
    private String teacherName;
    private String teacherSpecialty;
    private String className;
}
