package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    
    // Legacy methods for backward compatibility
    List<Message> findBySchoolId(Long schoolId);
    List<Message> findBySenderId(UUID senderId);
    List<Message> findByRecipientId(UUID recipientId);
    List<Message> findByRecipientIdAndIsRead(UUID recipientId, Boolean isRead);
    List<Message> findBySchoolIdAndRecipientId(Long schoolId, UUID recipientId);
    Long countByRecipientIdAndIsRead(UUID recipientId, Boolean isRead);

    // New methods for conversation-based messaging
    
    /**
     * Find messages in a conversation with pagination (cursor-based)
     */
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId AND m.deletedAt IS NULL " +
           "ORDER BY m.createdAt DESC")
    Page<Message> findByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    /**
     * Find messages in a conversation after a specific timestamp (for real-time updates)
     */
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId " +
           "AND m.createdAt > :since AND m.deletedAt IS NULL " +
           "ORDER BY m.createdAt ASC")
    List<Message> findByConversationIdSince(@Param("conversationId") UUID conversationId, 
                                            @Param("since") LocalDateTime since);

    /**
     * Count unread messages in a conversation for a specific user
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversationId = :conversationId " +
           "AND m.recipientId = :userId AND m.isRead = false AND m.deletedAt IS NULL")
    Long countUnreadByConversationAndRecipient(@Param("conversationId") UUID conversationId, 
                                                @Param("userId") UUID userId);

    /**
     * Count total unread messages for a user across all conversations
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipientId = :userId " +
           "AND m.isRead = false AND m.deletedAt IS NULL")
    Long countUnreadByRecipient(@Param("userId") UUID userId);

    /**
     * Get the last message in a conversation
     */
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId AND m.deletedAt IS NULL " +
           "ORDER BY m.createdAt DESC")
    List<Message> findLastByConversationId(@Param("conversationId") UUID conversationId, Pageable pageable);

    /**
     * Search messages in conversation by content
     */
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId " +
           "AND (LOWER(m.subject) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND m.deletedAt IS NULL " +
           "ORDER BY m.createdAt DESC")
    Page<Message> searchInConversation(@Param("conversationId") UUID conversationId, 
                                       @Param("searchTerm") String searchTerm, 
                                       Pageable pageable);

    /**
     * Find messages with attachments in a conversation
     */
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId " +
           "AND m.hasAttachments = true AND m.deletedAt IS NULL " +
           "ORDER BY m.createdAt DESC")
    Page<Message> findMessagesWithAttachments(@Param("conversationId") UUID conversationId, Pageable pageable);

    /**
     * Find all messages for a conversation (non-paginated, for export/backup)
     */
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId AND m.deletedAt IS NULL " +
           "ORDER BY m.createdAt ASC")
    List<Message> findAllByConversationId(@Param("conversationId") UUID conversationId);

    /**
     * Mark all messages as read in a conversation for a specific recipient
     */
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = :readTime, m.readBy = :userId " +
           "WHERE m.conversationId = :conversationId AND m.recipientId = :userId AND m.isRead = false AND m.deletedAt IS NULL")
    int markAllAsReadInConversation(@Param("conversationId") UUID conversationId, 
                                    @Param("userId") UUID userId, 
                                    @Param("readTime") LocalDateTime readTime);

    /**
     * Find unread messages in a conversation for a recipient (used for read receipts)
     */
    @Query("SELECT m FROM Message m WHERE m.conversationId = :conversationId " +
           "AND m.recipientId = :userId AND m.isRead = false AND m.deletedAt IS NULL")
    List<Message> findUnreadByConversationAndRecipient(@Param("conversationId") UUID conversationId,
                                                      @Param("userId") UUID userId);

    /**
     * Find messages scheduled for purge (GDPR compliance)
     */
    @Query("SELECT m FROM Message m WHERE m.deletedAt IS NOT NULL " +
           "AND m.deletedAt <= :purgeDate")
    List<Message> findMessagesForPurge(@Param("purgeDate") LocalDateTime purgeDate);
}

