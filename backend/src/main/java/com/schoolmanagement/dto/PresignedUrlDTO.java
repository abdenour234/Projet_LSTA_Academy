package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for presigned URL response (upload or download).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUrlDTO {
    
    private String url;
    private Integer expiresIn; // seconds
    private String method; // GET or PUT
    
    /**
     * For upload: the ID to reference after upload completes
     */
    private String uploadId;
}
