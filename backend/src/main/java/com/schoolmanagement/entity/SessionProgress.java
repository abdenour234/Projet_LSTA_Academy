package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "session_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", insertable = false, updatable = false)
    private TeachingSession teachingSession;

    @Column(nullable = false)
    private String competence;

    @Column(name = "acquired_count")
    private Integer acquiredCount;

    @Column(name = "not_acquired_count")
    private Integer notAcquiredCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
