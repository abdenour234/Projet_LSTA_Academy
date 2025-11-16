package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * SubjectDTO - Data Transfer Object for Subject
 * Used for creating and updating subjects
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubjectDTO {

    @NotNull(message = "School ID is required")
    private Long schoolId;

    @NotBlank(message = "Subject name is required")
    private String name;

    private String description;

    private Boolean isActive = true;
}
