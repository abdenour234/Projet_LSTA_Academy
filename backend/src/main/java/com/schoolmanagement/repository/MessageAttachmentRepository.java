package com.schoolmanagement.repository;

import com.schoolmanagement.entity.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for managing message attachments.
 */
@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, UUID> {

    /**
     * Find all attachments for a specific message
     */
    @Query("SELECT a FROM MessageAttachment a WHERE a.messageId = :messageId AND a.deletedAt IS NULL")
    List<MessageAttachment> findByMessageId(@Param("messageId") UUID messageId);

    /**
     * Find all attachments uploaded by a specific user
     */
    @Query("SELECT a FROM MessageAttachment a WHERE a.uploadedBy = :userId AND a.deletedAt IS NULL " +
           "ORDER BY a.uploadedAt DESC")
    List<MessageAttachment> findByUploadedBy(@Param("userId") UUID userId);

    /**
     * Count attachments for a message
     */
    @Query("SELECT COUNT(a) FROM MessageAttachment a WHERE a.messageId = :messageId AND a.deletedAt IS NULL")
    Long countByMessageId(@Param("messageId") UUID messageId);

    /**
     * Find attachments by scan status (for antivirus processing)
     */
    @Query("SELECT a FROM MessageAttachment a WHERE a.scanStatus = :status AND a.deletedAt IS NULL")
    List<MessageAttachment> findByScanStatus(@Param("status") String status);

    /**
     * Find attachments scheduled for purge (GDPR compliance)
     */
    @Query("SELECT a FROM MessageAttachment a WHERE a.purgeScheduledAt IS NOT NULL " +
           "AND a.purgeScheduledAt <= :now AND a.deletedAt IS NULL")
    List<MessageAttachment> findAttachmentsForPurge(@Param("now") LocalDateTime now);

    /**
     * Calculate total storage used by a user
     */
    @Query("SELECT COALESCE(SUM(a.fileSize), 0) FROM MessageAttachment a WHERE a.uploadedBy = :userId " +
           "AND a.deletedAt IS NULL")
    Long calculateUserStorageUsed(@Param("userId") UUID userId);

    /**
     * Calculate total storage used by school
     */
    @Query("SELECT COALESCE(SUM(a.fileSize), 0) FROM MessageAttachment a WHERE a.schoolId = :schoolId " +
           "AND a.deletedAt IS NULL")
    Long calculateSchoolStorageUsed(@Param("schoolId") Long schoolId);
}
