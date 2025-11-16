package com.schoolmanagement.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class CreateDiagnosticSessionRequest {
    private Long schoolId;
    private UUID teacherId;
    private String diagnosticType;
    private String gradeLevel;
    private String className;
    private UUID classId;
}