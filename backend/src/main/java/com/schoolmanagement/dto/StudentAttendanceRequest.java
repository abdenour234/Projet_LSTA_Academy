package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAttendanceRequest {
    private Long schoolId;
    private UUID classId;
    private LocalDate eventDate;
    private List<AbsentStudent> absentStudents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AbsentStudent {
        private UUID studentId;
        private String reason;
        private Boolean isJustified;
        private String teacherNotes;
    }
}
