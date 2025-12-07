package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a conversation between two users (teacher and admin).
 * Each conversation is uniquely identified by its two participants.
 */
@Entity
@Table(name = "conversations", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"participant1_id", "participant2_id"}),
       indexes = {
           @Index(name = "idx_conv_participant1", columnList = "participant1_id"),
           @Index(name = "idx_conv_participant2", columnList = "participant2_id"),
           @Index(name = "idx_conv_school", columnList = "school_id")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    /**
     * First participant ID (ordered to ensure uniqueness)
     * Always the smaller UUID to prevent duplicate conversations
     */
    @Column(name = "participant1_id", nullable = false)
    private UUID participant1Id;

    /**
     * Second participant ID (ordered to ensure uniqueness)
     * Always the larger UUID to prevent duplicate conversations
     */
    @Column(name = "participant2_id", nullable = false)
    private UUID participant2Id;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Last message timestamp for sorting conversations
     */
    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    /**
     * Soft delete flag for GDPR compliance
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        // Ensure participant1Id is always smaller than participant2Id for uniqueness
        if (participant1Id != null && participant2Id != null && 
            participant1Id.compareTo(participant2Id) > 0) {
            UUID temp = participant1Id;
            participant1Id = participant2Id;
            participant2Id = temp;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Check if a user is participant in this conversation
     */
    public boolean hasParticipant(UUID userId) {
        return participant1Id.equals(userId) || participant2Id.equals(userId);
    }

    /**
     * Get the other participant in the conversation
     */
    public UUID getOtherParticipant(UUID userId) {
        if (participant1Id.equals(userId)) {
            return participant2Id;
        } else if (participant2Id.equals(userId)) {
            return participant1Id;
        }
        throw new IllegalArgumentException("User is not a participant in this conversation");
    }
}
