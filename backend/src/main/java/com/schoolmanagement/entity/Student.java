package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;      // ← CHANGEMENT ICI
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "massar", nullable = false)
    private String massar;

    @Column(name = "class_id")
    private UUID classId;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;  // ← CHANGEMENT ICI (pas LocalDateTime)

    @Column
    private String gender;

    @Column(name = "parent_contact")
    private String parentContact;

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