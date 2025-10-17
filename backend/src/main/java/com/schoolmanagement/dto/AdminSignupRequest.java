package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSignupRequest {
    
    // Admin personal info
    private String fullName;
    private String email;
    private String password;
    
    // School info
    private String schoolName;
    private String schoolCity;
    private String schoolRegion;
    private String schoolLevel; // "Primaire", "Collège", "Lycée"
    private String schoolStatus; // "Public", "Privé"
    private String schoolAddress;
    private Integer schoolStudents;
}
