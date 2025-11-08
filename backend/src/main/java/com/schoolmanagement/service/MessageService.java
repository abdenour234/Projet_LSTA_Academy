package com.schoolmanagement.service;

import com.schoolmanagement.entity.Message;
import com.schoolmanagement.repository.MessageRepository;
import com.schoolmanagement.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;

import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final JwtUtil jwtUtil;

    /**
     * Get current authenticated user's ID from security context
     * Extracts userId from JWT token in Authorization header
     */
    private UUID getCurrentUserId() {
        try {
            // Get current HTTP request
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                throw new AccessDeniedException("No request context available");
            }
            
            HttpServletRequest request = attributes.getRequest();
            String authHeader = request.getHeader("Authorization");
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new AccessDeniedException("No valid JWT token found");
            }
            
            // Extract JWT token
            String jwt = authHeader.substring(7);
            
            // Extract userId claim from token
            String userIdStr = jwtUtil.extractUserId(jwt);
            
            if (userIdStr == null || userIdStr.isEmpty()) {
                throw new AccessDeniedException("No userId found in token");
            }
            
            return UUID.fromString(userIdStr);
            
        } catch (IllegalArgumentException e) {
            throw new AccessDeniedException("Invalid userId format in token");
        } catch (Exception e) {
            throw new AccessDeniedException("Failed to extract userId from token: " + e.getMessage());
        }
    }

    /**
     * Validate that the current user is either the sender or recipient of the message
     */
    public void validateMessageOwnership(Message message, UUID currentUserId) {
        if (currentUserId == null) {
            log.warn("Cannot validate ownership: currentUserId is null");
            return; // Skip validation if userId cannot be determined
        }
        
        if (!message.getSenderId().equals(currentUserId) && 
            !message.getRecipientId().equals(currentUserId)) {
            log.warn("Access denied: User {} attempted to access message {} owned by {} and {}", 
                    currentUserId, message.getId(), message.getSenderId(), message.getRecipientId());
            throw new AccessDeniedException("You don't have permission to access this message");
        }
    }

    /**
     * Get messages for the current user (as sender or recipient)
     */
    public List<Message> getMyMessages(UUID userId) {
        if (userId == null) {
            throw new AccessDeniedException("User not authenticated");
        }
        
        // Get all messages where user is either sender or recipient
        List<Message> sent = messageRepository.findBySenderId(userId);
        List<Message> received = messageRepository.findByRecipientId(userId);
        
        sent.addAll(received);
        return sent;
    }

    /**
     * Get a message by ID with ownership validation
     */
    public Message getMessageById(UUID messageId, UUID currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        validateMessageOwnership(message, currentUserId);
        return message;
    }

    /**
     * Get messages by recipient (with validation that requester is the recipient)
     */
    public List<Message> getMessagesByRecipient(UUID recipientId, UUID currentUserId) {
        if (currentUserId == null) {
            throw new AccessDeniedException("User not authenticated");
        }
        
        // Only allow users to query their own received messages
        if (!recipientId.equals(currentUserId)) {
            throw new AccessDeniedException("You can only access your own messages");
        }
        
        return messageRepository.findByRecipientId(recipientId);
    }

    /**
     * Get messages by sender (with validation that requester is the sender)
     */
    public List<Message> getMessagesBySender(UUID senderId, UUID currentUserId) {
        if (currentUserId == null) {
            throw new AccessDeniedException("User not authenticated");
        }
        
        // Only allow users to query their own sent messages
        if (!senderId.equals(currentUserId)) {
            throw new AccessDeniedException("You can only access your own messages");
        }
        
        return messageRepository.findBySenderId(senderId);
    }

    /**
     * Get unread messages for recipient (with validation)
     */
    public List<Message> getUnreadMessages(UUID recipientId, UUID currentUserId) {
        if (currentUserId == null) {
            throw new AccessDeniedException("User not authenticated");
        }
        
        // Only allow users to query their own unread messages
        if (!recipientId.equals(currentUserId)) {
            throw new AccessDeniedException("You can only access your own messages");
        }
        
        return messageRepository.findByRecipientIdAndIsRead(recipientId, false);
    }

    /**
     * Mark message as read (with ownership validation)
     */
    public Message markAsRead(UUID messageId, UUID currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        // Only the recipient can mark a message as read
        if (currentUserId == null || !message.getRecipientId().equals(currentUserId)) {
            throw new AccessDeniedException("Only the recipient can mark a message as read");
        }
        
        message.setIsRead(true);
        return messageRepository.save(message);
    }

    /**
     * Delete message (with ownership validation)
     */
    public void deleteMessage(UUID messageId, UUID currentUserId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        validateMessageOwnership(message, currentUserId);
        messageRepository.deleteById(messageId);
    }

    /**
     * Create a new message
     */
    public Message createMessage(Message message, UUID currentUserId) {
        if (currentUserId == null) {
            throw new AccessDeniedException("User not authenticated");
        }
        
        // Ensure the sender is the current user
        message.setSenderId(currentUserId);
        message.setIsRead(false);
        
        return messageRepository.save(message);
    }
}
