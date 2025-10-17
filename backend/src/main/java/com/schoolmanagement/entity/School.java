package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "schools")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class School {

    @Id
    @Column(length = 255)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String region;

    @Column(nullable = false)
    private String level;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private Integer students;

    @Column(name = "last_diagnostic")
    private LocalDateTime lastDiagnostic;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
