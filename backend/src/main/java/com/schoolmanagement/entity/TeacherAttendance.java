package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * TeacherAttendance Entity
 * Tracks teacher absences and late arrivals with dates
 * 
 * AC-02-03: Gestion des absences et retards des enseignants
 * Permet de suivre chaque absence ou retard d'un enseignant avec:
 * - Date de l'événement
 * - Type (ABSENCE ou RETARD)
 * - Motif/justification
 * - Classe concernée (optionnel)
 */
@Entity
@Table(name = "teacher_attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    /**
     * Reference to the teacher
     */
    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", insertable = false, updatable = false)
    private Teacher teacher;

    /**
     * School ID for filtering and access control
     */
    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    /**
     * Type of attendance event
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceType type;

    /**
     * Date of the absence or late arrival
     */
    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    /**
     * Optional: Class affected by this absence/lateness
     */
    @Column(name = "class_id")
    private UUID classId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", insertable = false, updatable = false)
    private Classe classe;

    /**
     * Reason or justification for the absence/lateness
     */
    @Column(length = 500)
    private String reason;

    /**
     * Is this event justified (has valid reason)?
     */
    @Column(name = "is_justified", nullable = false)
    private Boolean isJustified = false;

    /**
     * Duration in minutes (for late arrivals)
     */
    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    /**
     * Admin notes or comments
     */
    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    /**
     * User who recorded this event
     */
    @Column(name = "recorded_by")
    private UUID recordedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isJustified == null) {
            isJustified = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Enum for attendance types
     */
    public enum AttendanceType {
        ABSENCE,  // Absence complète
        RETARD    // Retard
    }
}
