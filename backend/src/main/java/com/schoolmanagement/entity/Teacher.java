package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Teacher Entity
 * Represents a teacher with a single specialty (subject).
 * Links to the Profile entity for user information.
 * 
 * Sprint 1 - Ticket 3: Teacher entity with single specialty
 * Added to support teacher management where:
 * - Each teacher has ONE specialty (the subject they teach)
 * - Teachers are linked to their user profile
 * - Teachers belong to a specific school
 * - The specialty field stores the name/label of their subject
 */
@Entity
@Table(name = "teachers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "profile_id", nullable = false, unique = true)
    private UUID profileId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    /**
     * The teacher's specialty - the subject they teach.
     * This is a custom label and doesn't need to exactly match a Subject name.
     * Example: "Mathematics", "Physics", "English Literature", etc.
     */
    @Column(nullable = false)
    private String specialty;

    @Column(name = "phone_number")
    private String phoneNumber;

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
