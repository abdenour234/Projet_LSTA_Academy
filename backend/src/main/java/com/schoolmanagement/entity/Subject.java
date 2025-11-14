package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Subject Entity
 * Represents a subject/course that can be taught in a school.
 * Each school can define its own list of subjects.
 * 
 * Sprint 1 - Ticket 2: Subject entity with school relationship
 * Added to support school-specific subject management where:
 * - Each school maintains its own list of subjects
 * - Subjects can have custom names per school
 * - Teachers will be assigned one specialty (subject)
 * - Classes will have multiple subjects with assigned teachers
 */
@Entity
@Table(name = "subjects", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"school_id", "name"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

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
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
