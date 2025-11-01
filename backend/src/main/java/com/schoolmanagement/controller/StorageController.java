package com.schoolmanagement.controller;

import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/storage")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class StorageController {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    // Maximum file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    
    // Allowed file types for security
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain", "text/csv"
    );
    
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        ".jpg", ".jpeg", ".png", ".gif", ".webp",
        ".pdf",
        ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".txt", ".csv"
    );

    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file is not empty
            if (file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File is empty");
                return ResponseEntity.badRequest().body(error);
            }

            // Validate file size (10MB limit)
            if (file.getSize() > MAX_FILE_SIZE) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File size exceeds maximum limit of 10MB");
                error.put("size", String.valueOf(file.getSize()));
                error.put("maxSize", String.valueOf(MAX_FILE_SIZE));
                log.warn("❌ File upload rejected: size {} exceeds limit {}", file.getSize(), MAX_FILE_SIZE);
                return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
            }
            
            // Validate file type by extension
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase() 
                : "";
            
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File type not allowed. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
                log.warn("❌ File upload rejected: extension {} not allowed", extension);
                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(error);
            }
            
            // Validate content type
            String contentType = file.getContentType();
            if (contentType != null && !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Content type not allowed");
                log.warn("❌ File upload rejected: content type {} not allowed", contentType);
                return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(error);
            }

            // Generate unique filename
            String filename = UUID.randomUUID().toString() + extension;
            
            // Set final content type
            if (contentType == null || contentType.isEmpty()) {
                contentType = detectContentType(extension);
            }

            // Upload to MinIO
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(filename)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(contentType)
                    .build()
            );

            log.info("✅ File uploaded successfully: {} (size: {} bytes, type: {})", 
                    filename, file.getSize(), contentType);

            // Return file info
            Map<String, String> response = new HashMap<>();
            response.put("filename", filename);
            response.put("originalName", originalFilename);
            response.put("url", "/api/storage/files/" + filename);
            response.put("contentType", contentType);
            response.put("size", String.valueOf(file.getSize()));
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("❌ Error uploading file: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to upload file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<byte[]> getFile(@PathVariable String filename) {
        try {
            // Check if file exists in MinIO
            StatObjectResponse stat;
            try {
                stat = minioClient.statObject(
                    StatObjectArgs.builder()
                        .bucket(bucketName)
                        .object(filename)
                        .build()
                );
            } catch (Exception e) {
                log.warn("⚠️ File not found: {}", filename);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(("File not found: " + filename).getBytes());
            }

            // Get file from MinIO
            InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(filename)
                    .build()
            );

            byte[] data = stream.readAllBytes();
            stream.close();

            // Get content type from MinIO metadata or detect from extension
            String contentType = stat.contentType();
            if (contentType == null || contentType.isEmpty()) {
                String extension = filename.contains(".") 
                    ? filename.substring(filename.lastIndexOf("."))
                    : "";
                contentType = detectContentType(extension);
            }

            log.info("✅ File retrieved successfully: {} (size: {} bytes, type: {})", 
                    filename, data.length, contentType);

            // Set proper headers - force inline viewing (not download)
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(data.length))
                    .body(data);
        } catch (Exception e) {
            log.error("❌ Error retrieving file {}: {}", filename, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error retrieving file: " + e.getMessage()).getBytes());
        }
    }

    @GetMapping("/signed-url")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> getSignedUrl(@RequestParam String fileName) {
        try {
            // Check if file exists before generating signed URL
            try {
                minioClient.statObject(
                    StatObjectArgs.builder()
                        .bucket(bucketName)
                        .object(fileName)
                        .build()
                );
            } catch (Exception e) {
                log.warn("⚠️ File not found for signed URL: {}", fileName);
                Map<String, String> error = new HashMap<>();
                error.put("error", "File not found: " + fileName);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }

            // Generate real MinIO pre-signed URL with 1 hour expiry
            String presignedUrl = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucketName)
                    .object(fileName)
                    .expiry(3600, TimeUnit.SECONDS) // 1 hour
                    .build()
            );

            log.info("✅ Generated pre-signed URL for file: {} (expires in 1 hour)", fileName);

            Map<String, String> response = new HashMap<>();
            response.put("url", presignedUrl);
            response.put("expiresIn", "3600"); // 1 hour in seconds
            response.put("fileName", fileName);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Error generating signed URL for {}: {}", fileName, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to generate signed URL: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/files/{filename}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Void> deleteFile(@PathVariable String filename) {
        try {
            minioClient.removeObject(
                io.minio.RemoveObjectArgs.builder()
                    .bucket(bucketName)
                    .object(filename)
                    .build()
            );
            log.info("✅ File deleted successfully: {}", filename);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("❌ Error deleting file {}: {}", filename, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Detect content type from file extension
     * @param extension File extension (e.g., ".pdf", ".jpg")
     * @return MIME type string
     */
    private String detectContentType(String extension) {
        return switch (extension.toLowerCase()) {
            case ".pdf" -> "application/pdf";
            case ".jpg", ".jpeg" -> "image/jpeg";
            case ".png" -> "image/png";
            case ".gif" -> "image/gif";
            case ".doc" -> "application/msword";
            case ".docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case ".xls" -> "application/vnd.ms-excel";
            case ".xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case ".ppt" -> "application/vnd.ms-powerpoint";
            case ".pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case ".txt" -> "text/plain";
            case ".csv" -> "text/csv";
            case ".json" -> "application/json";
            case ".xml" -> "application/xml";
            case ".zip" -> "application/zip";
            case ".mp4" -> "video/mp4";
            case ".mp3" -> "audio/mpeg";
            default -> "application/octet-stream";
        };
    }
}
