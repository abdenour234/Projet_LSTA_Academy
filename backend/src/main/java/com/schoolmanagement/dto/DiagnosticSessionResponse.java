package com.schoolmanagement.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DiagnosticSessionResponse {
    private UUID id;
    private Long schoolId;
    private UUID teacherId;
    private String diagnosticType;
    private String gradeLevel;
    private String className;
    private UUID classId;
    private Integer totalStudents;
    private String status;
    private LocalDateTime sessionDate;
    private LocalDateTime createdAt;
}