package com.schoolmanagement.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
import com.schoolmanagement.entity.School;
import com.schoolmanagement.entity.Activity;

@Entity
@Table(name = "activity_assignments")
@Data
public class ActivityAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @ManyToOne
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    private LocalDateTime assignedAt;

    private String assignedBy; // username or "superadmin"

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }
}
