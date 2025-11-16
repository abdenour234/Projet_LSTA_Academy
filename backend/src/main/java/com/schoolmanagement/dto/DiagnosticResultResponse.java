package com.schoolmanagement.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class DiagnosticResultResponse {
    private UUID id;
    private UUID sessionId;
    private UUID studentId;
    private JsonNode criteriaData;
    private String finalResult;
    private LocalDateTime createdAt;
}