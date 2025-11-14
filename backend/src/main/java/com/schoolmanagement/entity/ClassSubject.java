package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ClassSubject Entity (Join Table)
 * Represents the many-to-many relationship between Classes and Subjects,
 * with an assigned Teacher for each subject in a class.
 * 
 * Sprint 1 - Ticket 4: ClassSubject entity for class-subject-teacher mapping
 * Added to support class subject assignment where:
 * - Each class can have multiple subjects
 * - Each subject in a class has one assigned teacher
 * - A teacher can teach the same subject in multiple classes
 * - Ensures unique constraint: one subject appears only once per class
 */
@Entity
@Table(name = "class_subjects", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"class_id", "subject_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;

    /**
     * The teacher assigned to teach this subject in this class.
     * Can be null if not yet assigned.
     */
    @Column(name = "teacher_id")
    private UUID teacherId;

    /**
     * Number of hours per week for this subject in this class.
     */
    @Column(name = "hours_per_week")
    private Integer hoursPerWeek;

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
