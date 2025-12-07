package com.schoolmanagement.service;

import com.schoolmanagement.dto.ConversationDTO;
import com.schoolmanagement.dto.PagedResponse;
import com.schoolmanagement.entity.Conversation;
import com.schoolmanagement.entity.Message;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.ConversationRepository;
import com.schoolmanagement.repository.MessageRepository;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing conversations between teachers and admins.
 * Implements strict RBAC: only TEACHER and ADMIN roles can create/access conversations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserActivityLogService activityLogService;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /**
     * Validate that user has TEACHER or ADMIN role
     */
    public void validateUserRole(UUID userId) {
        List<UserRole> roles = userRoleRepository.findByUserId(userId);
        
        boolean hasValidRole = roles.stream()
            .anyMatch(role -> role.getRole() == UserRole.Role.TEACHER || 
                            role.getRole() == UserRole.Role.ADMIN);
        
        if (!hasValidRole) {
            log.warn("Access denied: User {} does not have TEACHER or ADMIN role", userId);
            throw new AccessDeniedException("Only teachers and admins can use the messaging system");
        }
    }

    /**
     * Validate that user is participant in the conversation
     */
    public void validateConversationAccess(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));
        
        if (!conversation.hasParticipant(userId)) {
            log.warn("Access denied: User {} attempted to access conversation {} they're not part of", 
                    userId, conversationId);
            throw new AccessDeniedException("You don't have permission to access this conversation");
        }
    }

    /**
     * Create or get existing conversation between two users.
     * Returns existing conversation if it already exists between the two participants.
     */
    public ConversationDTO createOrGetConversation(UUID currentUserId, UUID otherUserId, Long schoolId) {
        // Validate both users have valid roles
        validateUserRole(currentUserId);
        validateUserRole(otherUserId);

        // Check if conversation already exists
        Optional<Conversation> existing = conversationRepository.findByParticipants(currentUserId, otherUserId);
        
        if (existing.isPresent()) {
            log.info("Found existing conversation {} between users {} and {}", 
                    existing.get().getId(), currentUserId, otherUserId);
            
            // Log activity
            activityLogService.logActivity(
                currentUserId,
                schoolId,
                "CONVERSATION_ACCESSED",
                "User accessed existing conversation with user: " + otherUserId
            );
            
            return mapToDTO(existing.get(), currentUserId);
        }

        // Create new conversation
        Conversation conversation = new Conversation();
        conversation.setSchoolId(schoolId);
        conversation.setParticipant1Id(currentUserId.compareTo(otherUserId) < 0 ? currentUserId : otherUserId);
        conversation.setParticipant2Id(currentUserId.compareTo(otherUserId) < 0 ? otherUserId : currentUserId);
        
        Conversation saved = conversationRepository.save(conversation);
        
        log.info("Created new conversation {} between users {} and {}", 
                saved.getId(), currentUserId, otherUserId);

        // Log activity
        activityLogService.logActivity(
            currentUserId,
            schoolId,
            "CONVERSATION_CREATED",
            "User created conversation with user: " + otherUserId
        );

        return mapToDTO(saved, currentUserId);
    }

    /**
     * Get all conversations for the current user with pagination
     */
    public PagedResponse<ConversationDTO> getUserConversations(UUID userId, int page, int size) {
        validateUserRole(userId);

        Pageable pageable = PageRequest.of(page, size);
        Page<Conversation> conversationPage = conversationRepository.findByParticipant(userId, pageable);

        List<ConversationDTO> dtos = conversationPage.getContent().stream()
            .map(conv -> mapToDTO(conv, userId))
            .collect(Collectors.toList());

        PagedResponse<ConversationDTO> response = new PagedResponse<>();
        response.setContent(dtos);
        response.setPage(page);
        response.setSize(size);
        response.setTotalElements(conversationPage.getTotalElements());
        response.setTotalPages(conversationPage.getTotalPages());
        response.setHasNext(conversationPage.hasNext());
        response.setHasPrevious(conversationPage.hasPrevious());

        return response;
    }

    /**
     * Get a specific conversation by ID
     */
    public ConversationDTO getConversationById(UUID conversationId, UUID currentUserId) {
        validateUserRole(currentUserId);
        validateConversationAccess(conversationId, currentUserId);

        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        return mapToDTO(conversation, currentUserId);
    }

    /**
     * Soft delete a conversation (GDPR compliance)
     */
    public void deleteConversation(UUID conversationId, UUID currentUserId, Long schoolId) {
        validateUserRole(currentUserId);
        validateConversationAccess(conversationId, currentUserId);

        Conversation conversation = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation not found"));

        conversation.setDeletedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        log.info("User {} soft-deleted conversation {}", currentUserId, conversationId);

        // Log activity
        activityLogService.logActivity(
            currentUserId,
            schoolId,
            "CONVERSATION_DELETED",
            "User deleted conversation: " + conversationId
        );
    }

    /**
     * Update last message timestamp in conversation
     */
    public void updateLastMessageTime(UUID conversationId) {
        conversationRepository.findById(conversationId).ifPresent(conv -> {
            conv.setLastMessageAt(LocalDateTime.now());
            conversationRepository.save(conv);
        });
    }

    /**
     * Map Conversation entity to DTO with enriched data
     */
    private ConversationDTO mapToDTO(Conversation conversation, UUID currentUserId) {
        ConversationDTO dto = new ConversationDTO();
        dto.setId(conversation.getId());
        dto.setSchoolId(conversation.getSchoolId());
        
        // Get the other participant
        UUID otherParticipantId = conversation.getOtherParticipant(currentUserId);
        dto.setParticipantId(otherParticipantId);
        
        // Get participant name and role
        Profile profile = profileRepository.findByUserId(otherParticipantId).orElse(null);
        if (profile != null) {
            dto.setParticipantName(profile.getFirstName() + " " + profile.getLastName());
        }
        
        // Get participant role
        List<UserRole> roles = userRoleRepository.findByUserId(otherParticipantId);
        if (!roles.isEmpty()) {
            dto.setParticipantRole(roles.get(0).getRole().name());
        }
        
        // Get last message preview
        Pageable limit = PageRequest.of(0, 1);
        List<Message> lastMessages = messageRepository.findLastByConversationId(conversation.getId(), limit);
        if (!lastMessages.isEmpty()) {
            Message lastMessage = lastMessages.get(0);
            String preview = lastMessage.getContent();
            dto.setLastMessagePreview(preview.length() > 100 ? preview.substring(0, 100) + "..." : preview);
            dto.setLastMessageTime(lastMessage.getCreatedAt().format(FORMATTER));
        }
        
        // Count unread messages for current user
        Long unreadCount = messageRepository.countUnreadByConversationAndRecipient(conversation.getId(), currentUserId);
        dto.setUnreadCount(unreadCount);
        
        dto.setCreatedAt(conversation.getCreatedAt().format(FORMATTER));
        dto.setUpdatedAt(conversation.getUpdatedAt().format(FORMATTER));
        
        return dto;
    }
}
