package com.schoolmanagement.dto;

import lombok.Data;
import java.util.List;
import jakarta.validation.constraints.*;
@Data
public class ActivityCreationDTO {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;

    @NotBlank(message = "Content is required")
    private String content;

    @NotBlank(message = "Type is required")
    @Pattern(regexp = "lesson|exercise|quiz|project|evaluation",
            message = "Type must be one of: lesson, exercise, quiz, project, evaluation")
    private String type;

    @NotBlank(message = "Difficulty is required")
    @Pattern(regexp = "easy|medium|hard",
            message = "Difficulty must be one of: easy, medium, hard")
    private String difficulty;

    @NotBlank(message = "Duration is required")
    private String duration;

    @NotBlank(message = "Subject is required")
    @Size(min = 2, max = 100, message = "Subject must be between 2 and 100 characters")
    private String subject;

    @NotNull(message = "School IDs list cannot be null")
    @NotEmpty(message = "At least one school must be selected")
    private List<Long> schoolIds;

}
