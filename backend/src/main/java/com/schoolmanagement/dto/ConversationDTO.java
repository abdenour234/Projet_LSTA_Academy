package com.schoolmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * DTO for creating or retrieving a conversation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    
    private UUID id;
    
    @NotNull(message = "Participant ID is required")
    private UUID participantId;
    
    private Long schoolId;
    
    private String participantName;
    private String participantRole;
    
    private String lastMessagePreview;
    private String lastMessageTime;
    
    private Long unreadCount;
    
    private String createdAt;
    private String updatedAt;
}
