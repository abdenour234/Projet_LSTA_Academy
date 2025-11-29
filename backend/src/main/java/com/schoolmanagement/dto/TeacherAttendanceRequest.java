package com.schoolmanagement.dto;

import com.schoolmanagement.entity.TeacherAttendance.AttendanceType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO for creating teacher attendance records
 * Simplified version for API requests
 * AC-02-03: Gestion des absences et retards des enseignants
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherAttendanceRequest {

    @NotNull(message = "Teacher ID is required")
    private UUID teacherId;

    @NotNull(message = "Attendance type is required (ABSENCE or RETARD)")
    private AttendanceType type;

    @NotNull(message = "Event date is required")
    private LocalDate eventDate;

    private UUID classId;

    private String reason;

    private Boolean isJustified;

    /**
     * Duration in minutes (for late arrivals)
     * Example: 15 minutes late, 30 minutes late, etc.
     */
    private Integer durationMinutes;

    private String adminNotes;
}
