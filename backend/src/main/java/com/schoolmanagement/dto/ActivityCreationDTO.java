package com.schoolmanagement.dto;

import lombok.Data;
import java.util.List;

@Data
public class ActivityCreationDTO {
    private String title;
    private String description;
    private String content;
    private String type; // lesson, exercise, quiz, project, evaluation
    private String difficulty; // easy, medium, hard
    private String duration;
    private String subject;
    private List<Long> schoolIds;
}
