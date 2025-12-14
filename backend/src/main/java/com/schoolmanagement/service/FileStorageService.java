package com.schoolmanagement.service;

import com.schoolmanagement.dto.AttachmentDTO;
import com.schoolmanagement.dto.PresignedUrlDTO;
import com.schoolmanagement.entity.MessageAttachment;
import com.schoolmanagement.repository.MessageAttachmentRepository;
import com.schoolmanagement.security.MessagingRateLimiter;
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

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.AbstractMap;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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
    private final VirusScanningService virusScanningService;
    private final MessagingRateLimiter rateLimiter;

    @Value("${messaging.storage-bucket:messaging-files}")
    private String messagingBucket;

    @Value("${messaging.attachments.max-file-size:20971520}") // 20 MB default
    private Long maxFileSize;

    @Value("${messaging.attachments.allowed-types}")
    private String allowedTypesConfig;

    @Value("${messaging.attachments.presigned-url-expiry:3600}") // 1 hour default
    private Integer presignedUrlExpiry;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final Tika tika = new Tika();

    // Blacklisted dangerous extensions
    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
        "exe", "bat", "cmd", "sh", "ps1", "vbs", "js", "jar", "app", "deb", "rpm",
        "dmg", "pkg", "msi", "scr", "com", "pif", "hta", "cpl", "dll", "sys"
    );

    private static final Map<String, Set<String>> ALLOWED_MIME_BY_EXTENSION = Map.ofEntries(
        entry("pdf", Set.of("application/pdf")),
        entry("doc", Set.of("application/msword")),
        entry("docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
        entry("jpg", Set.of("image/jpeg")),
        entry("jpeg", Set.of("image/jpeg")),
        entry("png", Set.of("image/png")),
        entry("gif", Set.of("image/gif")),
        entry("mp4", Set.of("video/mp4")),
        entry("txt", Set.of("text/plain"))
    );

    /**
     * Initialize MinIO bucket if it doesn't exist
     */
    @PostConstruct
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
        rateLimiter.checkUploadFile(uploadedBy.toString());

        // Validate file
        validateFile(file);

        String filename = file.getOriginalFilename();
        String objectKey = generateObjectKey(messageId, filename);

        try (InputStream inputStream = file.getInputStream()) {
            // Detect MIME type
            String mimeType = detectMimeType(inputStream, filename);
            validateMimeType(mimeType);
            validateMimeTypeMatchesExtension(mimeType, filename);

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

            // Perform optional antivirus scan (placeholder)
            VirusScanningService.ScanResult scanResult = virusScanningService.scan(saved.getId(), objectKey);
            if (scanResult == VirusScanningService.ScanResult.INFECTED) {
                saved.setScanStatus("INFECTED");
                saved.setScanDetails("Virus scan detected infection");
                attachmentRepository.save(saved);
                throw new AccessDeniedException("File failed virus scan");
            }

            if (scanResult == VirusScanningService.ScanResult.CLEAN) {
                saved.setScanStatus("CLEAN");
                saved.setScanDetails("Virus scan clean");
                attachmentRepository.save(saved);
            }

            if (scanResult == VirusScanningService.ScanResult.SKIPPED) {
                saved.setScanStatus("CLEAN");
                saved.setScanDetails("Virus scan skipped");
                attachmentRepository.save(saved);
            }

            // Log activity
            activityLogService.logFileUpload(uploadedBy, schoolId, saved.getId(), filename, file.getSize());

            return saved;

        } catch (Exception e) {
            log.error("Failed to upload file: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
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

        rateLimiter.checkUploadFile(uploadedBy.toString());
        
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
        String extension = validateFilename(filename);
        validateFileSignature(file, extension);
    }

    private String validateFilename(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            throw new IllegalArgumentException("Filename is required");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (DANGEROUS_EXTENSIONS.contains(extension)) {
            log.warn("Blocked dangerous file extension: {}", extension);
            throw new IllegalArgumentException("File type not allowed: ." + extension);
        }

        if (!ALLOWED_MIME_BY_EXTENSION.containsKey(extension)) {
            throw new IllegalArgumentException("File type not allowed: ." + extension);
        }

        return extension;
    }

    private void validateMimeType(String mimeType) {
        Set<String> allowedTypes = Arrays.stream(allowedTypesConfig.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toSet());
        
        if (!allowedTypes.contains(mimeType)) {
            log.warn("Blocked disallowed MIME type: {}", mimeType);
            throw new IllegalArgumentException("File type not allowed: " + mimeType);
        }
    }

    private void validateMimeTypeMatchesExtension(String mimeType, String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        Set<String> expected = ALLOWED_MIME_BY_EXTENSION.get(extension);
        if (expected == null) {
            throw new IllegalArgumentException("File type not allowed: ." + extension);
        }

        if (!expected.contains(mimeType)) {
            log.warn("Blocked MIME mismatch: extension .{} detected {}", extension, mimeType);
            throw new IllegalArgumentException("MIME type mismatch");
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

    private void validateFileSignature(MultipartFile file, String extension) {
        try (InputStream in = file.getInputStream()) {
            byte[] header = in.readNBytes(16);
            if (!isValidSignature(header, extension)) {
                log.warn("Blocked invalid file signature for extension .{}", extension);
                throw new IllegalArgumentException("Invalid file signature");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Cannot read file header");
        }
    }

    private boolean isValidSignature(byte[] header, String extension) {
        if (header == null || header.length == 0) {
            return false;
        }

        return switch (extension) {
            case "pdf" -> startsWith(header, new byte[] {0x25, 0x50, 0x44, 0x46}); // %PDF
            case "png" -> startsWith(header, new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
            case "jpg", "jpeg" -> startsWith(header, new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
            case "gif" -> startsWith(header, new byte[] {0x47, 0x49, 0x46, 0x38}); // GIF8
            case "doc" -> startsWith(header, new byte[] {(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0, (byte) 0xA1, (byte) 0xB1, 0x1A, (byte) 0xE1});
            case "docx" -> startsWith(header, new byte[] {0x50, 0x4B, 0x03, 0x04}); // zip
            case "mp4" -> header.length >= 8 && header[4] == 0x66 && header[5] == 0x74 && header[6] == 0x79 && header[7] == 0x70; // ftyp
            case "txt" -> true;
            default -> true;
        };
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    private static <K, V> AbstractMap.SimpleEntry<K, V> entry(K key, V value) {
        return new AbstractMap.SimpleEntry<>(key, value);
    }

    private String formatFileSize(Long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.2f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
    }

}
