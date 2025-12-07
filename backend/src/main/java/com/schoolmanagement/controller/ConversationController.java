package com.schoolmanagement.controller;

import com.schoolmanagement.dto.ConversationDTO;
import com.schoolmanagement.dto.PagedResponse;
import com.schoolmanagement.service.ConversationService;
import com.schoolmanagement.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for managing conversations.
 * All endpoints require TEACHER or ADMIN role (enforced by @PreAuthorize).
 */
@RestController
@RequestMapping("/api/messaging/conversations")
@RequiredArgsConstructor
@Slf4j
public class ConversationController {

    private final ConversationService conversationService;
    private final JwtUtil jwtUtil;

    /**
     * Create or get existing conversation with another user
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ConversationDTO> createOrGetConversation(
        @Valid @RequestBody ConversationDTO request,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        Long schoolId = request.getSchoolId();
        
        ConversationDTO conversation = conversationService.createOrGetConversation(
            currentUserId,
            request.getParticipantId(),
            schoolId
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(conversation);
    }

    /**
     * Get all conversations for current user with pagination
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<PagedResponse<ConversationDTO>> getUserConversations(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        PagedResponse<ConversationDTO> conversations = conversationService.getUserConversations(
            currentUserId,
            page,
            size
        );
        
        return ResponseEntity.ok(conversations);
    }

    /**
     * Get a specific conversation by ID
     */
    @GetMapping("/{conversationId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ConversationDTO> getConversation(
        @PathVariable UUID conversationId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        ConversationDTO conversation = conversationService.getConversationById(
            conversationId,
            currentUserId
        );
        
        return ResponseEntity.ok(conversation);
    }

    /**
     * Delete a conversation (soft delete)
     */
    @DeleteMapping("/{conversationId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<Void> deleteConversation(
        @PathVariable UUID conversationId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        conversationService.deleteConversation(conversationId, currentUserId, schoolId);
        
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
