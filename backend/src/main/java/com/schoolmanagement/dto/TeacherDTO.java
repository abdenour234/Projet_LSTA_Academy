package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * TeacherDTO - Data Transfer Object for Teacher
 * Used for creating and updating teachers
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherDTO {

    @NotNull(message = "Profile ID is required")
    private UUID profileId;

    @NotNull(message = "School ID is required")
    private Long schoolId;

    @NotBlank(message = "Specialty is required")
    private String specialty;

    private String phoneNumber;

    private Boolean isActive = true;
}
