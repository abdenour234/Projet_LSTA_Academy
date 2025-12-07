package com.schoolmanagement.service;

import com.schoolmanagement.dto.AttachmentDTO;
import com.schoolmanagement.dto.MessageDTO;
import com.schoolmanagement.dto.PagedResponse;
import com.schoolmanagement.dto.SendMessageDTO;
import com.schoolmanagement.entity.Message;
import com.schoolmanagement.entity.MessageAttachment;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.repository.MessageAttachmentRepository;
import com.schoolmanagement.repository.MessageRepository;
import com.schoolmanagement.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Enhanced message service with conversation support, attachments, and real-time notifications.
 * Implements strict RBAC and audit logging.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EnhancedMessageService {

    private final MessageRepository messageRepository;
    private final MessageAttachmentRepository attachmentRepository;
    private final ProfileRepository profileRepository;
    private final ConversationService conversationService;
    private final FileStorageService fileStorageService;
    private final UserActivityLogService activityLogService;
    private final SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Send a message with optional attachments
     */
    public MessageDTO sendMessage(SendMessageDTO dto, UUID senderId, Long schoolId) {
        // Validate conversation access
        conversationService.validateConversationAccess(dto.getConversationId(), senderId);

        // Create message entity
        Message message = new Message();
        message.setConversationId(dto.getConversationId());
        message.setSenderId(senderId);
        
        // Get recipient from conversation
        UUID recipientId = conversationService.getConversationById(dto.getConversationId(), senderId)
            .getParticipantId();
        message.setRecipientId(recipientId);
        
        message.setSubject(dto.getSubject());
        message.setContent(dto.getContent());
        message.setSchoolId(schoolId);
        message.setIsRead(false);

        // Handle attachments
        List<MessageAttachment> uploadedAttachments = new ArrayList<>();
        
        if (dto.getAttachments() != null && !dto.getAttachments().isEmpty()) {
            // Save message first to get ID for attachments
            Message savedMessage = messageRepository.save(message);
            
            for (MultipartFile file : dto.getAttachments()) {
                try {
                    MessageAttachment attachment = fileStorageService.uploadFile(
                        file, 
                        savedMessage.getId(), 
                        senderId, 
                        schoolId
                    );
                    uploadedAttachments.add(attachment);
                } catch (Exception e) {
                    log.error("Failed to upload attachment: {}", e.getMessage(), e);
                    throw new RuntimeException("Failed to upload attachment: " + file.getOriginalFilename(), e);
                }
            }
            
            savedMessage.setHasAttachments(true);
            savedMessage.setAttachmentCount(uploadedAttachments.size());
            message = messageRepository.save(savedMessage);
        } else {
            message = messageRepository.save(message);
        }

        // Update conversation last message time
        conversationService.updateLastMessageTime(dto.getConversationId());

        // Log activity
        activityLogService.logMessageSent(
            senderId, 
            schoolId, 
            message.getId(), 
            dto.getConversationId(), 
            message.getHasAttachments()
        );

        // Send real-time notification via WebSocket
        sendRealtimeNotification(message, recipientId);

        // Convert to DTO and return
        return mapToDTO(message, uploadedAttachments, senderId, schoolId);
    }

    /**
     * Get messages in a conversation with pagination
     */
    public PagedResponse<MessageDTO> getConversationMessages(
        UUID conversationId, 
        UUID currentUserId, 
        Long schoolId,
        int page, 
        int size
    ) {
        // Validate access
        conversationService.validateConversationAccess(conversationId, currentUserId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messagePage = messageRepository.findByConversationId(conversationId, pageable);

        List<MessageDTO> dtos = messagePage.getContent().stream()
            .map(msg -> {
                List<MessageAttachment> attachments = attachmentRepository.findByMessageId(msg.getId());
                return mapToDTO(msg, attachments, currentUserId, schoolId);
            })
            .collect(Collectors.toList());

        PagedResponse<MessageDTO> response = new PagedResponse<>();
        response.setContent(dtos);
        response.setPage(page);
        response.setSize(size);
        response.setTotalElements(messagePage.getTotalElements());
        response.setTotalPages(messagePage.getTotalPages());
        response.setHasNext(messagePage.hasNext());
        response.setHasPrevious(messagePage.hasPrevious());

        return response;
    }

    /**
     * Mark a message as read
     */
    public MessageDTO markMessageAsRead(UUID messageId, UUID currentUserId, Long schoolId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        // Only recipient can mark as read
        if (!message.getRecipientId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the recipient can mark a message as read");
        }

        if (!message.isReadMessage()) {
            message.markAsRead(currentUserId);
            messageRepository.save(message);

            // Log activity
            activityLogService.logMessageRead(currentUserId, schoolId, messageId);

            // Notify sender via WebSocket
            sendReadReceiptNotification(message);
        }

        List<MessageAttachment> attachments = attachmentRepository.findByMessageId(messageId);
        return mapToDTO(message, attachments, currentUserId, schoolId);
    }

    /**
     * Mark all messages in a conversation as read
     */
    public void markAllMessagesAsRead(UUID conversationId, UUID currentUserId, Long schoolId) {
        conversationService.validateConversationAccess(conversationId, currentUserId);

        int updatedCount = messageRepository.markAllAsReadInConversation(
            conversationId, 
            currentUserId, 
            LocalDateTime.now()
        );

        log.info("Marked {} messages as read in conversation {} for user {}", 
                updatedCount, conversationId, currentUserId);

        // Log activity
        activityLogService.logActivity(
            currentUserId,
            schoolId,
            "MESSAGES_MARKED_READ",
            String.format("Marked %d messages as read in conversation %s", updatedCount, conversationId)
        );
    }

    /**
     * Get unread message count for user
     */
    public Long getUnreadMessageCount(UUID userId) {
        return messageRepository.countUnreadByRecipient(userId);
    }

    /**
     * Search messages in a conversation
     */
    public PagedResponse<MessageDTO> searchMessages(
        UUID conversationId,
        String searchTerm,
        UUID currentUserId,
        Long schoolId,
        int page,
        int size
    ) {
        conversationService.validateConversationAccess(conversationId, currentUserId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messagePage = messageRepository.searchInConversation(
            conversationId, 
            searchTerm, 
            pageable
        );

        List<MessageDTO> dtos = messagePage.getContent().stream()
            .map(msg -> {
                List<MessageAttachment> attachments = attachmentRepository.findByMessageId(msg.getId());
                return mapToDTO(msg, attachments, currentUserId, schoolId);
            })
            .collect(Collectors.toList());

        PagedResponse<MessageDTO> response = new PagedResponse<>();
        response.setContent(dtos);
        response.setPage(page);
        response.setSize(size);
        response.setTotalElements(messagePage.getTotalElements());
        response.setTotalPages(messagePage.getTotalPages());
        response.setHasNext(messagePage.hasNext());
        response.setHasPrevious(messagePage.hasPrevious());

        return response;
    }

    /**
     * Delete a message (soft delete for GDPR)
     */
    public void deleteMessage(UUID messageId, UUID currentUserId, Long schoolId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));

        // Only sender can delete their own message
        if (!message.getSenderId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the sender can delete a message");
        }

        message.setDeletedAt(LocalDateTime.now());
        messageRepository.save(message);

        log.info("User {} soft-deleted message {}", currentUserId, messageId);

        activityLogService.logActivity(
            currentUserId,
            schoolId,
            "MESSAGE_DELETED",
            String.format("Deleted message %s", messageId)
        );
    }

    // === REAL-TIME NOTIFICATIONS ===

    /**
     * Send real-time notification when new message arrives
     */
    private void sendRealtimeNotification(Message message, UUID recipientId) {
        try {
            String destination = "/topic/messages/" + recipientId;
            messagingTemplate.convertAndSend(destination, mapToSimpleDTO(message));
            log.debug("Sent WebSocket notification to {}", destination);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification: {}", e.getMessage(), e);
            // Don't fail the operation if WebSocket fails
        }
    }

    /**
     * Send read receipt notification to sender
     */
    private void sendReadReceiptNotification(Message message) {
        try {
            String destination = "/topic/read-receipts/" + message.getSenderId();
            messagingTemplate.convertAndSend(destination, Map.of(
                "messageId", message.getId(),
                "readBy", message.getReadBy(),
                "readAt", message.getReadAt().format(FORMATTER)
            ));
            log.debug("Sent read receipt notification to {}", destination);
        } catch (Exception e) {
            log.error("Failed to send read receipt: {}", e.getMessage(), e);
        }
    }

    // === MAPPING METHODS ===

    private MessageDTO mapToDTO(
        Message message, 
        List<MessageAttachment> attachments, 
        UUID currentUserId,
        Long schoolId
    ) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setConversationId(message.getConversationId());
        dto.setSenderId(message.getSenderId());
        dto.setRecipientId(message.getRecipientId());
        dto.setSubject(message.getSubject());
        dto.setContent(message.getContent());
        dto.setIsRead(message.getIsRead());
        dto.setReadAt(message.getReadAt() != null ? message.getReadAt().format(FORMATTER) : null);
        dto.setReadBy(message.getReadBy());
        dto.setHasAttachments(message.getHasAttachments());
        dto.setAttachmentCount(message.getAttachmentCount());
        dto.setCreatedAt(message.getCreatedAt().format(FORMATTER));
        dto.setUpdatedAt(message.getUpdatedAt() != null ? message.getUpdatedAt().format(FORMATTER) : null);
        dto.setSchoolId(message.getSchoolId());

        // Get sender name
        profileRepository.findByUserId(message.getSenderId()).ifPresent(profile -> 
            dto.setSenderName(profile.getFirstName() + " " + profile.getLastName())
        );

        // Get recipient name
        profileRepository.findByUserId(message.getRecipientId()).ifPresent(profile -> 
            dto.setRecipientName(profile.getFirstName() + " " + profile.getLastName())
        );

        // Map attachments
        if (attachments != null && !attachments.isEmpty()) {
            List<AttachmentDTO> attachmentDTOs = attachments.stream()
                .map(att -> fileStorageService.mapToDTO(att, currentUserId, schoolId))
                .collect(Collectors.toList());
            dto.setAttachments(attachmentDTOs);
        }

        return dto;
    }

    private Map<String, Object> mapToSimpleDTO(Message message) {
        return Map.of(
            "id", message.getId(),
            "conversationId", message.getConversationId(),
            "senderId", message.getSenderId(),
            "subject", message.getSubject(),
            "preview", message.getContent().substring(0, Math.min(100, message.getContent().length())),
            "hasAttachments", message.getHasAttachments(),
            "createdAt", message.getCreatedAt().format(FORMATTER)
        );
    }
}
