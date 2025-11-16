package com.schoolmanagement.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class DiagnosticStatsResponse {
    private Map<String, Integer> resultDistribution;
    private Map<String, Map<String, Integer>> criteriaStats;
    private List<StudentDetailResult> studentResults;
    
    @Data
    public static class StudentDetailResult {
        private String studentName;
        private Map<String, String> criteriaData;
        private String finalResult;
    }
}