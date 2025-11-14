package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "diagnostic_sessions")
public class DiagnosticSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "school_id", nullable = false)
    private Long schoolId;
    
    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;
    
    @Column(name = "diagnostic_type", nullable = false)
    private String diagnosticType;
    
    @Column(name = "grade_level", nullable = false)
    private String gradeLevel;
    
    @Column(name = "class_name")
    private String className;
    
    @Column(name = "class_id")
    private UUID classId;
    
    @Column(name = "total_students", nullable = false)
    private Integer totalStudents = 0;
    
    @Column(name = "status")
    private String status = "pending";
    
    @Column(name = "session_date")
    private LocalDateTime sessionDate;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}