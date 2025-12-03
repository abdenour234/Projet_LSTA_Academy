package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAttendanceStats {
    private UUID studentId;
    private String studentName;
    private Long totalAbsences;
    private Long justifiedAbsences;
    private Long unjustifiedAbsences;
    private Double attendanceRate; // Pourcentage de présence (si on a le total de jours de cours)
}
