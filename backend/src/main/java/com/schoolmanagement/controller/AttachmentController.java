package com.schoolmanagement.controller;

import com.schoolmanagement.dto.AttachmentDTO;
import com.schoolmanagement.dto.PresignedUrlDTO;
import com.schoolmanagement.service.FileStorageService;
import com.schoolmanagement.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * REST controller for managing file attachments.
 * All endpoints require TEACHER or ADMIN role.
 */
@RestController
@RequestMapping("/api/messaging/attachments")
@RequiredArgsConstructor
@Slf4j
public class AttachmentController {

    private final FileStorageService fileStorageService;
    private final JwtUtil jwtUtil;

    /**
     * Upload a file attachment directly
     */
    @PostMapping("/upload")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<AttachmentDTO> uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam UUID messageId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) throws Exception {
        UUID currentUserId = extractUserId(httpRequest);
        
        var attachment = fileStorageService.uploadFile(file, messageId, currentUserId, schoolId);
        var dto = fileStorageService.mapToDTO(attachment, currentUserId, schoolId);
        
        return ResponseEntity.ok(dto);
    }

    /**
     * Generate presigned URL for upload (alternative flow)
     */
    @PostMapping("/presigned-upload-url")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<PresignedUrlDTO> generateUploadUrl(
        @RequestParam String filename,
        @RequestParam UUID messageId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) throws Exception {
        UUID currentUserId = extractUserId(httpRequest);
        
        PresignedUrlDTO presignedUrl = fileStorageService.generateUploadPresignedUrl(
            filename,
            messageId,
            currentUserId,
            schoolId
        );
        
        return ResponseEntity.ok(presignedUrl);
    }

    /**
     * Generate presigned URL for download
     */
    @GetMapping("/{attachmentId}/download-url")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<PresignedUrlDTO> generateDownloadUrl(
        @PathVariable UUID attachmentId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) throws Exception {
        UUID currentUserId = extractUserId(httpRequest);
        
        PresignedUrlDTO presignedUrl = fileStorageService.generateDownloadPresignedUrl(
            attachmentId,
            currentUserId,
            schoolId
        );
        
        return ResponseEntity.ok(presignedUrl);
    }

    /**
     * Delete a file attachment
     */
    @DeleteMapping("/{attachmentId}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<Void> deleteAttachment(
        @PathVariable UUID attachmentId,
        @RequestParam Long schoolId,
        HttpServletRequest httpRequest
    ) {
        UUID currentUserId = extractUserId(httpRequest);
        
        fileStorageService.deleteFile(attachmentId, currentUserId, schoolId);
        
        return ResponseEntity.noContent().build();
    }

    // === UTILITY METHODS ===

    private UUID extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Missing or invalid Authorization header");
        }
        
        String token = authHeader.substring(7);
        String userIdStr = jwtUtil.extractUserId(token);
        
        return UUID.fromString(userIdStr);
    }
}
