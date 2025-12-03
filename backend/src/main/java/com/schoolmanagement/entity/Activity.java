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
    private Long schoolId;

    @Column(name = "class_id")  // NEW: Link to class
    private UUID classId;

    @Column(name = "subject_id")  // Subject/Matière for the activity
    private UUID subjectId;

    @Column(name = "approval_status", nullable = false)
    private String approvalStatus = "PENDING"; // PENDING, APPROVED, DENIED

    @Column(name = "approved_by")
    private UUID approvedBy; // Teacher who approved/denied

    @Column(nullable = false)
    private String type;
    // NEW: nature (must be "Classe" ou "fait maison")
    @Column(name = "nature", nullable = false)
    private String nature;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String level;

    @Column(name = "layout_data", columnDefinition = "TEXT")
    private String layoutData;

    @Column(name = "is_published")
    private Boolean isPublished;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", updatable = false) 
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
        if (isPublished == null) {
            isPublished = false;
        }
        if (approvalStatus == null) {
            approvalStatus = "PENDING";
        }
        if (nature == null) {
            nature = "Classe";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}