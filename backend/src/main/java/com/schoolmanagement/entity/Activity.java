package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "school_id", nullable = false)
    private String schoolId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", insertable = false, updatable = false)
    private School school;

    @Column(nullable = false)
    private String type; // Orale, Lecture, Écriture

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private String level;

    @Column(name = "created_by")
    private UUID createdBy;

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
