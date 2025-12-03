package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for teacher attendance statistics
 * Used for visualizations and reports
 * AC-02-03: Gestion des absences et retards des enseignants
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherAttendanceStats {

    private UUID teacherId;
    private String teacherName;
    private String teacherSpecialty;

    /**
     * Total number of absences
     */
    private Long totalAbsences;

    /**
     * Total number of late arrivals
     */
    private Long totalRetards;

    /**
     * Number of justified absences
     */
    private Long justifiedAbsences;

    /**
     * Number of unjustified absences
     */
    private Long unjustifiedAbsences;

    /**
     * Number of justified late arrivals
     */
    private Long justifiedRetards;

    /**
     * Number of unjustified late arrivals
     */
    private Long unjustifiedRetards;

    /**
     * Monthly breakdown of absences and retards
     */
    private List<MonthlyStats> monthlyStats;

    /**
     * Recent attendance events (for timeline display)
     */
    private List<TeacherAttendanceDTO> recentEvents;

    /**
     * Inner class for monthly statistics
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyStats {
        private String month; // Format: "2025-01", "2025-02", etc.
        private Long absences;
        private Long retards;
    }
}
