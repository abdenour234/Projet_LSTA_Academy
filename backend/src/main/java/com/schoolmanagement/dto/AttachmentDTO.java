package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for file attachment metadata.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDTO {
    
    private UUID id;
    private UUID messageId;
    
    private String filename;
    private String mimeType;
    private Long fileSize;
    private String fileSizeFormatted; // e.g., "2.5 MB"
    
    private UUID uploadedBy;
    private String uploadedByName;
    private String uploadedAt;
    
    private String scanStatus;
    private String scanDetails;
    
    /**
     * Presigned download URL (temporary, expires)
     */
    private String downloadUrl;
    
    /**
     * Is file safe to download
     */
    private Boolean isSafe;
}
