package com.schoolmanagement.controller;

import com.schoolmanagement.service.MinioStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileStorageController {

    private final MinioStorageService minioStorageService;

    /**
     * Upload a file
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }

            String fileName = minioStorageService.uploadFile(file);
            String downloadUrl = minioStorageService.getPresignedUrl(fileName, 60); // 60 minutes expiry

            Map<String, String> response = new HashMap<>();
            response.put("fileName", fileName);
            response.put("downloadUrl", downloadUrl);
            response.put("originalName", file.getOriginalFilename());
            response.put("contentType", file.getContentType());
            response.put("size", String.valueOf(file.getSize()));

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    /**
     * Get a presigned download URL for a file
     */
    @GetMapping("/download-url/{fileName}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, String>> getDownloadUrl(
            @PathVariable String fileName,
            @RequestParam(defaultValue = "60") int expiryMinutes) {
        try {
            if (!minioStorageService.fileExists(fileName)) {
                return ResponseEntity.notFound().build();
            }

            String url = minioStorageService.getPresignedUrl(fileName, expiryMinutes);
            return ResponseEntity.ok(Map.of("downloadUrl", url, "fileName", fileName));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate download URL: " + e.getMessage()));
        }
    }

    /**
     * Download a file directly
     */
    @GetMapping("/download/{fileName}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable String fileName) {
        try {
            if (!minioStorageService.fileExists(fileName)) {
                return ResponseEntity.notFound().build();
            }

            InputStream inputStream = minioStorageService.getFile(fileName);
            InputStreamResource resource = new InputStreamResource(inputStream);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a file
     */
    @DeleteMapping("/{fileName}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, String>> deleteFile(@PathVariable String fileName) {
        try {
            if (!minioStorageService.fileExists(fileName)) {
                return ResponseEntity.notFound().build();
            }

            minioStorageService.deleteFile(fileName);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully", "fileName", fileName));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        }
    }

    /**
     * Check if a file exists
     */
    @GetMapping("/exists/{fileName}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
    public ResponseEntity<Map<String, Boolean>> checkFileExists(@PathVariable String fileName) {
        boolean exists = minioStorageService.fileExists(fileName);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
