package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Conversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for managing conversations between users.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    /**
     * Find a conversation between two participants (order-independent)
     */
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.participant1Id = :user1 AND c.participant2Id = :user2) OR " +
           "(c.participant1Id = :user2 AND c.participant2Id = :user1)")
    Optional<Conversation> findByParticipants(@Param("user1") UUID user1, @Param("user2") UUID user2);

    /**
     * Find all conversations for a specific user (as either participant)
     */
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.participant1Id = :userId OR c.participant2Id = :userId) " +
           "AND c.deletedAt IS NULL " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    List<Conversation> findByParticipant(@Param("userId") UUID userId);

    /**
     * Find conversations with pagination
     */
    @Query("SELECT c FROM Conversation c WHERE " +
           "(c.participant1Id = :userId OR c.participant2Id = :userId) " +
           "AND c.deletedAt IS NULL " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST, c.createdAt DESC")
    Page<Conversation> findByParticipant(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Find conversations by school
     */
    @Query("SELECT c FROM Conversation c WHERE c.schoolId = :schoolId AND c.deletedAt IS NULL " +
           "ORDER BY c.lastMessageAt DESC NULLS LAST")
    List<Conversation> findBySchoolId(@Param("schoolId") Long schoolId);

    /**
     * Count active conversations for a user
     */
    @Query("SELECT COUNT(c) FROM Conversation c WHERE " +
           "(c.participant1Id = :userId OR c.participant2Id = :userId) " +
           "AND c.deletedAt IS NULL")
    Long countByParticipant(@Param("userId") UUID userId);
}
