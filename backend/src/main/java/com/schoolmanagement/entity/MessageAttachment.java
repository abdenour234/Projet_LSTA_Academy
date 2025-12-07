package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a file attachment for a message.
 * Files are stored in MinIO and metadata is kept in database.
 */
@Entity
@Table(name = "message_attachments",
       indexes = {
           @Index(name = "idx_attachment_message", columnList = "message_id"),
           @Index(name = "idx_attachment_uploader", columnList = "uploaded_by")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    /**
     * Original filename uploaded by user
     */
    @Column(name = "filename", nullable = false)
    private String filename;

    /**
     * MIME type detected during upload
     */
    @Column(name = "mime_type", nullable = false)
    private String mimeType;

    /**
     * File size in bytes
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * MinIO object key/path for storage
     */
    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    /**
     * SHA-256 hash for integrity verification and antivirus validation
     */
    @Column(name = "file_hash")
    private String fileHash;

    /**
     * User who uploaded the file
     */
    @Column(name = "uploaded_by", nullable = false)
    private UUID uploadedBy;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    /**
     * Antivirus scan status: PENDING, CLEAN, INFECTED, ERROR
     */
    @Column(name = "scan_status")
    private String scanStatus;

    /**
     * Antivirus scan result details
     */
    @Column(name = "scan_details", columnDefinition = "TEXT")
    private String scanDetails;

    /**
     * Soft delete for GDPR compliance (files purged after X days)
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Scheduled purge date for GDPR compliance
     */
    @Column(name = "purge_scheduled_at")
    private LocalDateTime purgeScheduledAt;

    @PrePersist
    protected void onCreate() {
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
        if (scanStatus == null) {
            scanStatus = "PENDING";
        }
    }

    /**
     * Check if file is safe to download
     */
    public boolean isSafeToDownload() {
        return "CLEAN".equals(scanStatus) || "PENDING".equals(scanStatus);
    }
}
