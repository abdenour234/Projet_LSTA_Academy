package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "diagnostics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Diagnostic {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "school_id", nullable = false)
    private String schoolId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", insertable = false, updatable = false)
    private School school;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String level;

    private Integer result; // 0-100

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
