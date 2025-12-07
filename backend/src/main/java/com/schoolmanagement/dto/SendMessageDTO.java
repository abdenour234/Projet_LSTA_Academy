package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * DTO for sending a message with optional attachments.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageDTO {
    
    @NotNull(message = "Conversation ID is required")
    private UUID conversationId;
    
    @NotBlank(message = "Subject is required")
    @Size(max = 255, message = "Subject must not exceed 255 characters")
    private String subject;
    
    @NotBlank(message = "Content is required")
    @Size(max = 10000, message = "Content must not exceed 10000 characters")
    private String content;
    
    /**
     * Optional file attachments (multipart upload)
     */
    private List<MultipartFile> attachments;
    
    /**
     * Alternative: attachment IDs if using presigned URL upload flow
     */
    private List<UUID> attachmentIds;
}
