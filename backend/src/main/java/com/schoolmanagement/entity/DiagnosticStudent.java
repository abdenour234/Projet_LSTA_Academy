package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "diagnostic_students")
public class DiagnosticStudent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;
    
    @Column(name = "student_id", nullable = false)
    private UUID studentId;
    
    @Column(name = "student_name", nullable = false)
    private String studentName;
    
    @Column(name = "student_order", nullable = false)
    private Integer studentOrder;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}