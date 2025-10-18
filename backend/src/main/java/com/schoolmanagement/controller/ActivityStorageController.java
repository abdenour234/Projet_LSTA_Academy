package com.schoolmanagement.controller;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.errors.MinioException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for managing activity file uploads with MinIO.
 * Files are automatically deleted after 7 days (configured in MinioLifecycleConfig).
 */
@RestController
@RequestMapping("/api/activity-storage")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ActivityStorageController {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    private static final String FILE_PREFIX = "activity-files/";

    /**
     * Upload a file for an activity.
     * File will be automatically deleted after 7 days.
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File is empty");
                return ResponseEntity.badRequest().body(error);
            }

            // Generate unique filename with prefix
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String filename = FILE_PREFIX + UUID.randomUUID().toString() + extension;

            // Upload to MinIO
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(filename)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );

            log.info("✅ File uploaded successfully: {} (will be deleted after 7 days)", filename);

            // Return file info
            Map<String, String> response = new HashMap<>();
            response.put("filename", filename);
            response.put("originalName", originalFilename);
            response.put("url", "/api/activity-storage/files/" + filename.replace(FILE_PREFIX, ""));
            response.put("ttl", "7 days");
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            log.error("❌ Error uploading file: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get a file from MinIO.
     */
    @GetMapping("/files/{filename}")
    public ResponseEntity<byte[]> getFile(@PathVariable String filename) {
        try {
            String objectName = FILE_PREFIX + filename;
            
            InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
            );

            byte[] data = stream.readAllBytes();
            stream.close();

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .body(data);
                    
        } catch (Exception e) {
            log.error("❌ Error retrieving file {}: {}", filename, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get file info including remaining TTL.
     */
    @GetMapping("/info/{filename}")
    public ResponseEntity<Map<String, Object>> getFileInfo(@PathVariable String filename) {
        try {
            String objectName = FILE_PREFIX + filename;
            
            // Check if file exists
            minioClient.statObject(
                io.minio.StatObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .build()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("filename", filename);
            response.put("url", "/api/activity-storage/files/" + filename);
            response.put("ttl", "7 days");
            response.put("autoDelete", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
