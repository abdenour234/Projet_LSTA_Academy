package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAttendanceDTO {
    private UUID id;
    private Long schoolId;
    private UUID teacherId;
    private String teacherName;
    private UUID classId;
    private String className;
    private UUID studentId;
    private String studentName;
    private LocalDate eventDate;
    private String reason;
    private Boolean isJustified;
    private String teacherNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
