package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "teaching_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeachingSession {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", insertable = false, updatable = false)
    private Classe classe;

    @Column(name = "school_id", nullable = false)
    private String schoolId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", insertable = false, updatable = false)
    private School school;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "activities_realized", columnDefinition = "text[]")
    private String[] activitiesRealized;

    @Column(name = "percentage_acquired")
    private Integer percentageAcquired; // 0-100

    private String remarks;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
