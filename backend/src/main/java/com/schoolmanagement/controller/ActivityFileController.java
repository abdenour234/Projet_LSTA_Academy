package com.schoolmanagement.controller;

import com.schoolmanagement.entity.ActivityFile;
import com.schoolmanagement.service.ActivityFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.*;

/**
 * REST Controller for activity file operations.
 */
@RestController
@RequestMapping("/api/activity-files")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ActivityFileController {

    private final ActivityFileService activityFileService;

    /**
     * Upload multiple files for an activity.
     * 
     * @param activityId Activity ID
     * @param files Array of files to upload
     * @param elementIds Corresponding element IDs (optional)
     * @return List of uploaded file metadata
     */
    @PostMapping("/upload/{activityId}")
    public ResponseEntity<Map<String, Object>> uploadFiles(
            @PathVariable UUID activityId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "elementIds", required = false) String[] elementIds) {
        
        try {
            List<Map<String, Object>> uploadedFiles = new ArrayList<>();
            
            for (int i = 0; i < files.length; i++) {
                MultipartFile file = files[i];
                String elementId = (elementIds != null && i < elementIds.length) ? elementIds[i] : null;
                
                ActivityFile activityFile = activityFileService.uploadFile(
                    activityId, 
                    file, 
                    elementId, 
                    i
                );
                
                Map<String, Object> fileData = new HashMap<>();
                fileData.put("id", activityFile.getId().toString());
                fileData.put("fileName", activityFile.getFileName());
                fileData.put("fileType", activityFile.getFileType());
                fileData.put("minioKey", activityFile.getMinioKey());
                fileData.put("fileSize", activityFile.getFileSize());
                fileData.put("mimeType", activityFile.getMimeType());
                fileData.put("elementId", activityFile.getElementId());
                fileData.put("url", "/api/activity-files/download/" + activityFile.getId());
                fileData.put("ttl", "7 days");
                
                uploadedFiles.add(fileData);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("files", uploadedFiles);
            response.put("count", uploadedFiles.size());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            log.error("Error uploading files for activity {}: {}", activityId, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", "Failed to upload files: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get all files for an activity.
     */
    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<Map<String, Object>>> getActivityFiles(@PathVariable UUID activityId) {
        try {
            List<ActivityFile> files = activityFileService.getActivityFiles(activityId);
            List<Map<String, Object>> response = new ArrayList<>();
            
            for (ActivityFile file : files) {
                Map<String, Object> fileData = new HashMap<>();
                fileData.put("id", file.getId().toString());
                fileData.put("fileName", file.getFileName());
                fileData.put("fileType", file.getFileType());
                fileData.put("fileSize", file.getFileSize());
                fileData.put("mimeType", file.getMimeType());
                fileData.put("elementId", file.getElementId());
                fileData.put("position", file.getPosition());
                fileData.put("url", "/api/activity-files/download/" + file.getId());
                fileData.put("createdAt", file.getCreatedAt());
                response.add(fileData);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting files for activity {}: {}", activityId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download a file.
     */
    @GetMapping("/download/{fileId}")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable UUID fileId) {
        try {
            ActivityFile file = activityFileService.getFileById(fileId);
            if (file == null) {
                log.warn("File not found: {}", fileId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            InputStream stream = activityFileService.getFileStream(file.getMinioKey());
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFileName() + "\"")
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400") // Cache for 1 day
                .contentType(MediaType.parseMediaType(file.getMimeType() != null ? file.getMimeType() : "application/octet-stream"))
                .body(new InputStreamResource(stream));
                
        } catch (Exception e) {
            log.error("Error downloading file {}: {}", fileId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Delete a file.
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable UUID fileId) {
        try {
            activityFileService.deleteFile(fileId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error deleting file {}: {}", fileId, e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
