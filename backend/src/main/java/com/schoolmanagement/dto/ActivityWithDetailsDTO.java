package com.schoolmanagement.dto;

import com.schoolmanagement.entity.Activity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityWithDetailsDTO {
    private Activity activity;
    private String className;
    private String subjectName;
    private String teacherName;
    private UUID teacherId;
    
    // Constructeur pratique
    public ActivityWithDetailsDTO(Activity activity) {
        this.activity = activity;
    }
}
