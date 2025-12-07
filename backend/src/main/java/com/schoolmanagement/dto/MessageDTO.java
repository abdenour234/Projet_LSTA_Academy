package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for message response with full details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    
    private UUID id;
    private UUID conversationId;
    private UUID senderId;
    private String senderName;
    private UUID recipientId;
    private String recipientName;
    
    private String subject;
    private String content;
    
    private Boolean isRead;
    private String readAt;
    private UUID readBy;
    
    private Boolean hasAttachments;
    private Integer attachmentCount;
    private List<AttachmentDTO> attachments;
    
    private String createdAt;
    private String updatedAt;
    
    private Long schoolId;
}
