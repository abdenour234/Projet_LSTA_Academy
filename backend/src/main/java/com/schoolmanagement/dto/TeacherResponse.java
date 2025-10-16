package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String schoolId;
    private String matiere;
    private String phone;
}
