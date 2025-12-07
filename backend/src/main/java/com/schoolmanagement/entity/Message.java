package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a message in a conversation.
 * Enhanced with conversation tracking, read receipts, and attachment support.
 */
@Entity
@Table(name = "messages",
       indexes = {
           @Index(name = "idx_msg_conversation", columnList = "conversation_id"),
           @Index(name = "idx_msg_sender", columnList = "sender_id"),
           @Index(name = "idx_msg_recipient", columnList = "recipient_id"),
           @Index(name = "idx_msg_created", columnList = "created_at")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    /**
     * Reference to the conversation this message belongs to
     */
    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    /**
     * Boolean flag for backward compatibility
     */
    @Column(name = "is_read")
    private Boolean isRead;

    /**
     * Timestamp when message was read (for read receipts)
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * User ID who read the message (for multi-participant support in future)
     */
    @Column(name = "read_by")
    private UUID readBy;

    /**
     * Flag to indicate if message has file attachments
     */
    @Column(name = "has_attachments")
    private Boolean hasAttachments;

    /**
     * Count of attachments for quick display
     */
    @Column(name = "attachment_count")
    private Integer attachmentCount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Soft delete for GDPR compliance
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
        if (isRead == null) {
            isRead = false;
        }
        if (hasAttachments == null) {
            hasAttachments = false;
        }
        if (attachmentCount == null) {
            attachmentCount = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Mark message as read by a specific user
     */
    public void markAsRead(UUID userId) {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
        this.readBy = userId;
    }

    /**
     * Check if message is read
     */
    public boolean isReadMessage() {
        return Boolean.TRUE.equals(isRead);
    }
}
