package com.schoolmanagement.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
public class SaveDiagnosticResultsRequest {
    private UUID sessionId;
    private List<StudentResult> results;
    
    @Data
    public static class StudentResult {
        private UUID studentId;
        private Map<String, String> criteriaData;
        private String finalResult;
    }
}