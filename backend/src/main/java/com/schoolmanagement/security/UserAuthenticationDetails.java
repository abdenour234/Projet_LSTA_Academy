package com.schoolmanagement.security;

import java.io.Serializable;
import java.util.UUID;

/**
 * Custom authentication details that includes userId from JWT token.
 * This avoids having to re-parse the JWT token in every authorization check.
 */
public class UserAuthenticationDetails implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    private final UUID userId;
    private final String email;
    private final String role;
    private final String schoolId;
    
    public UserAuthenticationDetails(UUID userId, String email, String role, String schoolId) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.schoolId = schoolId;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public String getEmail() {
        return email;
    }
    
    public String getRole() {
        return role;
    }
    
    public String getSchoolId() {
        return schoolId;
    }
    
    @Override
    public String toString() {
        return "UserAuthenticationDetails{" +
                "userId=" + userId +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", schoolId='" + schoolId + '\'' +
                '}';
    }
}
