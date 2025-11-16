package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * ClassSubjectDTO - Data Transfer Object for ClassSubject
 * Used for assigning subjects and teachers to classes
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassSubjectDTO {

    @NotNull(message = "Class ID is required")
    private UUID classId;

    @NotNull(message = "Subject ID is required")
    private UUID subjectId;

    private UUID teacherId;

    private Integer hoursPerWeek;
}
