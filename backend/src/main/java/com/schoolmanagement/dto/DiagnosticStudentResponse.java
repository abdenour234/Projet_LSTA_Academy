package com.schoolmanagement.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class DiagnosticStudentResponse {
    private UUID id;
    private UUID sessionId;
    private UUID studentId;
    private String studentName;
    private Integer studentOrder;
}