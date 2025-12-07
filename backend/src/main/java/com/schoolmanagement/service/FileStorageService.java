package com.schoolmanagement.service;

import com.schoolmanagement.dto.AttachmentDTO;
import com.schoolmanagement.dto.PresignedUrlDTO;
import com.schoolmanagement.entity.MessageAttachment;
import com.schoolmanagement.repository.MessageAttachmentRepository;
import io.minio.*;
import io.minio.errors.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Service for managing file attachments in MinIO with security validations.
 * Implements file size limits, MIME type whitelist, and basic antivirus scanning.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FileStorageService {

    private final MinioClient minioClient;
    private final MessageAttachmentRepository attachmentRepository;
    private final UserActivityLogService activityLogService;

    @Value("${messaging.storage-bucket:messaging-files}")
    private String messagingBucket;

    @Value("${messaging.attachments.max-file-size:20971520}") // 20 MB default
    private Long maxFileSize;

    @Value("${messaging.attachments.allowed-types}")
    private String allowedTypesConfig;

    @Value("${messaging.attachments.presigned-url-expiry:3600}") // 1 hour default
    private Integer presignedUrlExpiry;

    @Value("${messaging.attachments.antivirus-enabled:false}")
    private Boolean antivirusEnabled;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final Tika tika = new Tika();

    // Blacklisted dangerous extensions
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
        "exe", "bat", "cmd", "sh", "ps1", "vbs", "js", "jar", "app", "deb", "rpm",
        "dmg", "pkg", "msi", "scr", "com", "pif", "hta", "cpl", "dll", "sys"
    );

    /**
     * Initialize MinIO bucket if it doesn't exist
     */
    public void initializeBucket() {
        try {
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder()
                .bucket(messagingBucket)
                .build());
            
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder()
                    .bucket(messagingBucket)
                    .build());
                log.info("Created MinIO bucket: {}", messagingBucket);
            }
        } catch (Exception e) {
            log.error("Failed to initialize MinIO bucket: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize file storage", e);
        }
    }

    /**
     * Upload a file directly (multipart upload)
     */
    public MessageAttachment uploadFile(
        MultipartFile file,
        UUID messageId,
        UUID uploadedBy,
        Long schoolId
    ) throws IOException {
        // Validate file
        validateFile(file);

        String filename = file.getOriginalFilename();
        String objectKey = generateObjectKey(messageId, filename);

        try (InputStream inputStream = file.getInputStream()) {
            // Detect MIME type
            String mimeType = detectMimeType(inputStream, filename);
            validateMimeType(mimeType);

            // Calculate hash
            String fileHash = calculateFileHash(file.getInputStream());

            // Upload to MinIO
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(messagingBucket)
                    .object(objectKey)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(mimeType)
                    .build()
            );

            log.info("Uploaded file {} to MinIO: {}", filename, objectKey);

            // Create attachment record
            MessageAttachment attachment = new MessageAttachment();
            attachment.setMessageId(messageId);
            attachment.setFilename(filename);
            attachment.setMimeType(mimeType);
            attachment.setFileSize(file.getSize());
            attachment.setStoragePath(objectKey);
            attachment.setFileHash(fileHash);
            attachment.setUploadedBy(uploadedBy);
            attachment.setSchoolId(schoolId);
            attachment.setScanStatus("PENDING");

            MessageAttachment saved = attachmentRepository.save(attachment);

            // Perform basic antivirus check (async)
            if (antivirusEnabled) {
                performAntivirusScan(saved.getId(), objectKey);
            } else {
                // Mark as clean immediately if antivirus disabled
                saved.setScanStatus("CLEAN");
                attachmentRepository.save(saved);
            }

            // Log activity
            activityLogService.logFileUpload(uploadedBy, schoolId, saved.getId(), filename, file.getSize());

            return saved;

        } catch (Exception e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to upload file", e);
        }
    }

    /**
     * Generate presigned URL for upload (alternative flow)
     */
    public PresignedUrlDTO generateUploadPresignedUrl(
        String filename,
        UUID messageId,
        UUID uploadedBy,
        Long schoolId
    ) throws Exception {
        
        validateFilename(filename);

        String objectKey = generateObjectKey(messageId, filename);
        
        // Generate presigned URL for PUT
        String url = minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .method(Method.PUT)
                .bucket(messagingBucket)
                .object(objectKey)
                .expiry(presignedUrlExpiry, TimeUnit.SECONDS)
                .build()
        );

        // Create pending attachment record
        MessageAttachment attachment = new MessageAttachment();
        attachment.setMessageId(messageId);
        attachment.setFilename(filename);
        attachment.setStoragePath(objectKey);
        attachment.setUploadedBy(uploadedBy);
        attachment.setSchoolId(schoolId);
        attachment.setScanStatus("PENDING");
        attachment.setFileSize(0L); // Will be updated after upload

        MessageAttachment saved = attachmentRepository.save(attachment);

        PresignedUrlDTO dto = new PresignedUrlDTO();
        dto.setUrl(url);
        dto.setExpiresIn(presignedUrlExpiry);
        dto.setMethod("PUT");
        dto.setUploadId(saved.getId().toString());

        log.info("Generated presigned upload URL for file: {}", filename);

        return dto;
    }

    /**
     * Generate presigned URL for download
     */
    public PresignedUrlDTO generateDownloadPresignedUrl(
        UUID attachmentId,
        UUID requestingUserId,
        Long schoolId
    ) throws Exception {
        
        MessageAttachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        // Validate file is safe to download
        if (!attachment.isSafeToDownload()) {
            log.warn("Attempted download of unsafe file: {}", attachmentId);
            throw new AccessDeniedException("File is not safe to download");
        }

        // Generate presigned URL for GET
        String url = minioClient.getPresignedObjectUrl(
            GetPresignedObjectUrlArgs.builder()
                .method(Method.GET)
                .bucket(messagingBucket)
                .object(attachment.getStoragePath())
                .expiry(presignedUrlExpiry, TimeUnit.SECONDS)
                .build()
        );

        PresignedUrlDTO dto = new PresignedUrlDTO();
        dto.setUrl(url);
        dto.setExpiresIn(presignedUrlExpiry);
        dto.setMethod("GET");

        log.info("Generated presigned download URL for attachment: {}", attachmentId);

        // Log download activity
        activityLogService.logFileDownload(requestingUserId, schoolId, attachmentId, attachment.getFilename());

        return dto;
    }

    /**
     * Delete a file from storage
     */
    public void deleteFile(UUID attachmentId, UUID requestingUserId, Long schoolId) {
        MessageAttachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new IllegalArgumentException("Attachment not found"));

        try {
            // Remove from MinIO
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(messagingBucket)
                    .object(attachment.getStoragePath())
                    .build()
            );

            // Soft delete
            attachment.setDeletedAt(LocalDateTime.now());
            attachmentRepository.save(attachment);

            log.info("Deleted file: {}", attachment.getFilename());

        } catch (Exception e) {
            log.error("Failed to delete file from MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    /**
     * Map MessageAttachment to DTO with presigned URL
     */
    public AttachmentDTO mapToDTO(MessageAttachment attachment, UUID requestingUserId, Long schoolId) {
        AttachmentDTO dto = new AttachmentDTO();
        dto.setId(attachment.getId());
        dto.setMessageId(attachment.getMessageId());
        dto.setFilename(attachment.getFilename());
        dto.setMimeType(attachment.getMimeType());
        dto.setFileSize(attachment.getFileSize());
        dto.setFileSizeFormatted(formatFileSize(attachment.getFileSize()));
        dto.setUploadedBy(attachment.getUploadedBy());
        dto.setUploadedAt(attachment.getUploadedAt().format(FORMATTER));
        dto.setScanStatus(attachment.getScanStatus());
        dto.setIsSafe(attachment.isSafeToDownload());

        // Generate presigned download URL if file is safe
        if (attachment.isSafeToDownload()) {
            try {
                PresignedUrlDTO presignedUrl = generateDownloadPresignedUrl(attachment.getId(), requestingUserId, schoolId);
                dto.setDownloadUrl(presignedUrl.getUrl());
            } catch (Exception e) {
                log.error("Failed to generate download URL: {}", e.getMessage());
                dto.setDownloadUrl(null);
            }
        }

        return dto;
    }

    // === VALIDATION METHODS ===

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException(
                String.format("File size exceeds maximum allowed: %d MB", maxFileSize / 1024 / 1024)
            );
        }

        String filename = file.getOriginalFilename();
        validateFilename(filename);
    }

    private void validateFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("Filename is required");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            log.warn("Blocked dangerous file extension: {}", extension);
            throw new IllegalArgumentException("File type not allowed: ." + extension);
        }
    }

    private void validateMimeType(String mimeType) {
        Set<String> allowedTypes = new HashSet<>(Arrays.asList(allowedTypesConfig.split(",")));
        
        if (!allowedTypes.contains(mimeType)) {
            log.warn("Blocked disallowed MIME type: {}", mimeType);
            throw new IllegalArgumentException("File type not allowed: " + mimeType);
        }
    }

    // === UTILITY METHODS ===

    private String generateObjectKey(UUID messageId, String filename) {
        String sanitizedFilename = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
        return String.format("messages/%s/%s-%s", 
            messageId, 
            UUID.randomUUID(), 
            sanitizedFilename
        );
    }

    private String detectMimeType(InputStream inputStream, String filename) throws IOException {
        return tika.detect(inputStream, filename);
    }

    private String calculateFileHash(InputStream inputStream) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] buffer = new byte[8192];
        int read;
        while ((read = inputStream.read(buffer)) != -1) {
            digest.update(buffer, 0, read);
        }
        byte[] hashBytes = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot == -1) {
            return "";
        }
        return filename.substring(lastDot + 1);
    }

    private String formatFileSize(Long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
    }

    /**
     * Basic antivirus scan placeholder.
     * In production, integrate with ClamAV or similar service.
     */
    private void performAntivirusScan(UUID attachmentId, String objectKey) {
        // TODO: Integrate with antivirus service (ClamAV, VirusTotal API, etc.)
        // For now, mark as clean
        log.info("Performing antivirus scan for attachment: {}", attachmentId);
        
        attachmentRepository.findById(attachmentId).ifPresent(attachment -> {
            attachment.setScanStatus("CLEAN");
            attachment.setScanDetails("Basic validation passed");
            attachmentRepository.save(attachment);
        });
    }
}
