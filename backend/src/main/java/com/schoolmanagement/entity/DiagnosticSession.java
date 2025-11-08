package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "diagnostic_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DiagnosticSession {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "class_id")
    private UUID classId;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String level;

    @Column(name = "grid_type")
    private String gridType; // 'orale', 'lecture', 'ecriture'

    @Column(columnDefinition = "JSONB")
    private String results; // JSON data of student results

    @Column(name = "session_date")
    private LocalDateTime sessionDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
