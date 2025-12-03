package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for tracking teacher events (student absences and other events)
 */
@Entity
@Table(name = "historique_professeur")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoriqueProfesseur {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "class_id")
    private UUID classId;

    @Column(name = "student_id")
    private UUID studentId;

    @Column(name = "event_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private EventType eventType;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Builder.Default
    @Column(name = "is_justified", nullable = false)
    private Boolean isJustified = false;

    @Column(name = "teacher_notes", columnDefinition = "TEXT")
    private String teacherNotes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum EventType {
        ABSENCE,      // Student absence
        OTHER         // Other teacher events
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
