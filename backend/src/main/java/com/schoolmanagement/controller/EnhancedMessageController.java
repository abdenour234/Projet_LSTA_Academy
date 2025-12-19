package com.schoolmanagement.controller;

import com.schoolmanagement.dto.MessageDTO;
import com.schoolmanagement.dto.PagedResponse;
import com.schoolmanagement.dto.SendMessageDTO;
import com.schoolmanagement.entity.MessageAttachment;
import com.schoolmanagement.repository.MessageAttachmentRepository;
import com.schoolmanagement.service.EnhancedMessageService;
import com.schoolmanagement.util.JwtUtil;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for enhanced messaging features.
 * All endpoints require TEACHER or ADMIN role.
 */
@RestController
@RequestMapping("/api/messaging/enhanced")
@RequiredArgsConstructor
@Slf4j
public class EnhancedMessageController {

    private final EnhancedMessageService messageService;
    private final JwtUtil jwtUtil;
    private final MinioClient minioClient;
    private final MessageAttachmentRepository attachmentRepository;

    @Value("${minio.messaging.bucket-name:messaging-files}")
    private String messagingBucket;

    /**
     * Send a new message with optional attachments
     * Supports multipart/form-data for file uploads
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<MessageDTO> sendMessage(
        @Valid @ModelAttribute SendMessageDTO request,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        MessageDTO message = messageService.sendMessage(request, currentUserId, schoolId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(message);
    }

    /**
     * Get messages in a conversation with pagination
     */
    @GetMapping("/conversation/{conversationId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<PagedResponse<MessageDTO>> getConversationMessages(
        @PathVariable UUID conversationId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        PagedResponse<MessageDTO> messages = messageService.getConversationMessages(
            conversationId,
            currentUserId,
            schoolId,
            page,
            size
        );
        
        return ResponseEntity.ok(messages);
    }

    /**
     * Search messages in a conversation
     */
    @GetMapping("/conversation/{conversationId}/search")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<PagedResponse<MessageDTO>> searchMessages(
        @PathVariable UUID conversationId,
        @RequestParam String query,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        PagedResponse<MessageDTO> messages = messageService.searchMessages(
            conversationId,
            query,
            currentUserId,
            schoolId,
            page,
            size
        );
        
        return ResponseEntity.ok(messages);
    }

    /**
     * Mark a specific message as read
     */
    @PutMapping("/{messageId}/read")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<MessageDTO> markAsRead(
        @PathVariable UUID messageId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        MessageDTO message = messageService.markMessageAsRead(messageId, currentUserId, schoolId);
        
        return ResponseEntity.ok(message);
    }

    /**
     * Mark all messages in a conversation as read
     */
    @PutMapping("/conversation/{conversationId}/read-all")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<Void> markAllAsRead(
        @PathVariable UUID conversationId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        messageService.markAllMessagesAsRead(conversationId, currentUserId, schoolId);
        
        return ResponseEntity.noContent().build();
    }

    /**
     * Get unread message count for current user
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<Map<String, Long>> getUnreadCount(HttpServletRequest httpRequest) {
        UUID currentUserId = extractUserId(httpRequest);
        
        Long unreadCount = messageService.getUnreadMessageCount(currentUserId);
        
        return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
    }

    /**
     * Download message attachment
     * Proxies the file from MinIO to avoid CORS and internal URL issues
     */
    @GetMapping("/attachments/{attachmentId}/download")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<InputStreamResource> downloadAttachment(
        @PathVariable UUID attachmentId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        try {
            UUID currentUserId = extractUserId(httpRequest);
            
            // Get attachment metadata
            MessageAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

            // Validate file is safe to download
            if (!attachment.isSafeToDownload()) {
                log.warn("Attempted download of unsafe file: {}", attachmentId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Get file from MinIO
            InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(messagingBucket)
                    .object(attachment.getStoragePath())
                    .build()
            );

            // Set proper headers for download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(attachment.getMimeType()));
            headers.setContentLength(attachment.getFileSize());
            headers.setContentDispositionFormData("attachment", attachment.getFilename());

            log.info("✅ Attachment downloaded: {} by user {}", attachmentId, currentUserId);

            return ResponseEntity.ok()
                .headers(headers)
                .body(new InputStreamResource(stream));

        } catch (Exception e) {
            log.error("❌ Error downloading attachment {}: {}", attachmentId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a message (soft delete)
     */
    @DeleteMapping("/{messageId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<Void> deleteMessage(
        @PathVariable UUID messageId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        messageService.deleteMessage(messageId, currentUserId, schoolId);
        
        return ResponseEntity.noContent().build();
    }

    // === UTILITY METHODS ===

    private UUID extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        
        String token = authHeader.substring(7);
        String userIdStr = jwtUtil.extractUserId(token);
        
        return UUID.fromString(userIdStr);
    }
}
