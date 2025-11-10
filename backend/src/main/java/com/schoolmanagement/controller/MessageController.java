package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Message;
import com.schoolmanagement.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * Get all messages for the current user (as sender or recipient)
     */
    @GetMapping
    public ResponseEntity<List<Message>> getAllMessages(Authentication authentication) {
        UUID userId = extractUserIdFromAuth(authentication);
        return ResponseEntity.ok(messageService.getMyMessages(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Message> getMessage(@PathVariable UUID id, Authentication authentication) {
        UUID userId = extractUserIdFromAuth(authentication);
        Message message = messageService.getMessageById(id, userId);
        return ResponseEntity.ok(message);
    }

    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<List<Message>> getMessagesByRecipient(
            @PathVariable UUID recipientId, 
            Authentication authentication) {
        UUID userId = extractUserIdFromAuth(authentication);
        return ResponseEntity.ok(messageService.getMessagesByRecipient(recipientId, userId));
    }

    @GetMapping("/sender/{senderId}")
    public ResponseEntity<List<Message>> getMessagesBySender(
            @PathVariable UUID senderId,
            Authentication authentication) {
        UUID userId = extractUserIdFromAuth(authentication);
        return ResponseEntity.ok(messageService.getMessagesBySender(senderId, userId));
    }

    @GetMapping("/unread/{recipientId}")
    public ResponseEntity<List<Message>> getUnreadMessages(
            @PathVariable UUID recipientId,
            Authentication authentication) {
        UUID userId = extractUserIdFromAuth(authentication);
        return ResponseEntity.ok(messageService.getUnreadMessages(recipientId, userId));
    }

    @PostMapping
    public ResponseEntity<Message> createMessage(
            @RequestBody Message message,
            Authentication authentication) {
        UUID userId = extractUserIdFromAuth(authentication);
        Message saved = messageService.createMessage(message, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/mark-read")
    public ResponseEntity<Message> markAsRead(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = extractUserIdFromAuth(authentication);
        Message updated = messageService.markAsRead(id, userId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = extractUserIdFromAuth(authentication);
        messageService.deleteMessage(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Extract user ID from JWT authentication
     * Note: This is a simplified version. In production, extract from JWT claims.
     */
    private UUID extractUserIdFromAuth(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        // For now, return null to skip ownership validation
        // TODO: Extract userId from JWT token claims
        return null;
    }
}
