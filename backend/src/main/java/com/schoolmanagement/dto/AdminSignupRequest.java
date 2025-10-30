package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminSignupRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, and one number")
    private String password;

    // School info
    @NotBlank(message = "School name is required")
    @Size(min = 2, max = 200, message = "School name must be between 2 and 200 characters")
    private String schoolName;

    @Size(max = 100, message = "City name cannot exceed 100 characters")
    private String schoolCity;

    @Size(max = 100, message = "Region name cannot exceed 100 characters")
    private String schoolRegion;

    @Pattern(regexp = "Primaire|Collège|Lycée",
            message = "School level must be one of: Primaire, Collège, Lycée")
    private String schoolLevel;

    @Pattern(regexp = "Public|Privé",
            message = "School status must be either Public or Privé")
    private String schoolStatus;

    @Size(max = 500, message = "Address cannot exceed 500 characters")
    private String schoolAddress;

    @Min(value = 0, message = "Number of students cannot be negative")
    @Max(value = 100000, message = "Number of students seems unrealistic")
    private Integer schoolStudents;

}
