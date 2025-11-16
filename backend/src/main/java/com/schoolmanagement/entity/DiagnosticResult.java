package com.schoolmanagement.entity;

import com.fasterxml.jackson.databind.JsonNode;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;



@Data
@Entity
@Table(name = "diagnostic_results")
public class DiagnosticResult {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(name = "session_id", nullable = false)
    private UUID sessionId;
    
    @Column(name = "student_id", nullable = false)
    private UUID studentId;
    
    @Type(JsonBinaryType.class)
    @Column(name = "criteria_data", columnDefinition = "jsonb", nullable = false)
    private JsonNode criteriaData;
    
    @Column(name = "final_result", nullable = false)
    private String finalResult;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}