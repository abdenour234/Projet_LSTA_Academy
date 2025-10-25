package com.schoolmanagement.controller;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/storage")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class StorageController {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "File is empty");
                return ResponseEntity.badRequest().body(error);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
            String filename = UUID.randomUUID().toString() + extension;
            
            // Upload to MinIO
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(filename)
                    .stream(file.getInputStream(), file.getSize(), -1)
                    .contentType(file.getContentType())
                    .build()
            );

            log.info("✅ File uploaded successfully: {}", filename);

            // Return file info
            Map<String, String> response = new HashMap<>();
            response.put("filename", filename);
            response.put("originalName", originalFilename);
            response.put("url", "/api/storage/files/" + filename);
            
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
            InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                    .bucket(bucketName)
                    .object(filename)
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

    @GetMapping("/signed-url")
    public ResponseEntity<Map<String, String>> getSignedUrl(@RequestParam String fileName) {
        // For now, just return the direct URL. In production, implement token-based signed URLs
        Map<String, String> response = new HashMap<>();
        response.put("url", "/api/storage/files/" + fileName);
        response.put("expiresIn", "3600"); // 1 hour
        
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/files/{filename}")
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
}
