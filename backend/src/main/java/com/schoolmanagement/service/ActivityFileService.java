package com.schoolmanagement.service;

import com.schoolmanagement.entity.ActivityFile;
import com.schoolmanagement.repository.ActivityFileRepository;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

/**
 * Service for managing activity files with MinIO storage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityFileService {

    private final ActivityFileRepository activityFileRepository;
    private final MinioClient minioClient;

    @Value("${minio.bucket-name:school-management}")
    private String bucketName;

    private static final String FILE_PREFIX = "activity-files/";

    /**
     * Upload a file and associate it with an activity.
     */
    @Transactional
    public ActivityFile uploadFile(UUID activityId, MultipartFile file, String elementId, Integer position) {
        try {
            // Generate unique MinIO key
            String fileExtension = getFileExtension(file.getOriginalFilename());
            String minioKey = FILE_PREFIX + UUID.randomUUID() + fileExtension;

            // Upload to MinIO
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(minioKey)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );

            // Create metadata record
            ActivityFile activityFile = new ActivityFile();
            activityFile.setActivityId(activityId);
            activityFile.setFileName(file.getOriginalFilename());
            activityFile.setMinioKey(minioKey);
            activityFile.setFileSize(file.getSize());
            activityFile.setMimeType(file.getContentType());
            activityFile.setFileType(determineFileType(file.getContentType()));
            activityFile.setElementId(elementId);
            activityFile.setPosition(position != null ? position : 0);

            ActivityFile saved = activityFileRepository.save(activityFile);
            log.info("File uploaded successfully: {} for activity {}", minioKey, activityId);
            
            return saved;

        } catch (Exception e) {
            log.error("Failed to upload file for activity {}: {}", activityId, e.getMessage());
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    /**
     * Get all files for an activity.
     */
    public List<ActivityFile> getActivityFiles(UUID activityId) {
        return activityFileRepository.findByActivityIdOrderByPositionAsc(activityId);
    }

    /**
     * Get a single file by ID.
     */
    public ActivityFile getFileById(UUID fileId) {
        return activityFileRepository.findById(fileId).orElse(null);
    }

    /**
     * Get file content from MinIO.
     */
    public InputStream getFileStream(String minioKey) {
        try {
            return minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(minioKey)
                    .build()
            );
        } catch (Exception e) {
            log.error("Failed to get file from MinIO: {}", minioKey, e);
            throw new RuntimeException("Failed to retrieve file: " + e.getMessage(), e);
        }
    }

    /**
     * Delete a file from both MinIO and database.
     */
    @Transactional
    public void deleteFile(UUID fileId) {
        try {
            ActivityFile file = activityFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

            // Delete from MinIO
            minioClient.removeObject(
                RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(file.getMinioKey())
                    .build()
            );

            // Delete from database
            activityFileRepository.delete(file);
            log.info("File deleted successfully: {}", file.getMinioKey());

        } catch (Exception e) {
            log.error("Failed to delete file {}: {}", fileId, e.getMessage());
            throw new RuntimeException("Failed to delete file: " + e.getMessage(), e);
        }
    }

    /**
     * Delete all files for an activity.
     */
    @Transactional
    public void deleteActivityFiles(UUID activityId) {
        List<ActivityFile> files = activityFileRepository.findByActivityIdOrderByPositionAsc(activityId);
        
        for (ActivityFile file : files) {
            try {
                minioClient.removeObject(
                    RemoveObjectArgs.builder()
                        .bucket(bucketName)
                        .object(file.getMinioKey())
                        .build()
                );
            } catch (Exception e) {
                log.warn("Failed to delete file from MinIO: {}", file.getMinioKey(), e);
            }
        }

        activityFileRepository.deleteByActivityId(activityId);
        log.info("Deleted {} files for activity {}", files.size(), activityId);
    }

    /**
     * Determine file type from MIME type.
     */
    private String determineFileType(String mimeType) {
        if (mimeType == null) return "unknown";
        
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.startsWith("video/")) return "video";
        if (mimeType.equals("application/pdf")) return "pdf";
        if (mimeType.startsWith("text/")) return "text";
        
        return "other";
    }

    /**
     * Extract file extension from filename.
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
