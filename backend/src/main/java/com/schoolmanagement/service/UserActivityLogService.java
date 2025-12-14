package com.schoolmanagement.service;

import com.schoolmanagement.entity.UserActivityLog;
import com.schoolmanagement.repository.UserActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Service for logging user activities for audit and compliance.
 * All messaging activities are logged for traceability.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserActivityLogService {

    private final UserActivityLogRepository userActivityLogRepository;

    /**
     * Log a user activity asynchronously to avoid blocking main operations
     */
    @Async
    @Transactional
    public void logActivity(UUID userId, Long schoolId, String actionType, String details) {
        try {
            UserActivityLog log = new UserActivityLog();
            log.setUserId(userId);
            log.setSchoolId(schoolId);
            log.setActivityType(actionType);
            log.setActionType(actionType);
            log.setDetails(details);
            log.setActivityDate(LocalDate.now());
            
            userActivityLogRepository.save(log);
            
            this.log.debug("Logged activity: {} for user {} at school {}", actionType, userId, schoolId);
        } catch (Exception e) {
            this.log.error("Failed to log activity: {}", e.getMessage(), e);
            // Don't fail the main operation if logging fails
        }
    }

    /**
     * Log conversation creation
     */
    public void logConversationCreated(UUID userId, Long schoolId, UUID conversationId, UUID otherUserId) {
        logActivity(
            userId,
            schoolId,
            "CONVERSATION_CREATED",
            String.format("Created conversation %s with user %s", conversationId, otherUserId)
        );
    }

    /**
     * Log message sent
     */
    public void logMessageSent(UUID userId, Long schoolId, UUID messageId, UUID conversationId, boolean hasAttachments) {
        String details = String.format("Sent message %s in conversation %s", messageId, conversationId);
        if (hasAttachments) {
            details += " with attachments";
        }
        logActivity(userId, schoolId, "MESSAGE_SENT", details);
    }

    /**
     * Log message read
     */
    public void logMessageRead(UUID userId, Long schoolId, UUID messageId) {
        logActivity(
            userId,
            schoolId,
            "MESSAGE_READ",
            String.format("Read message %s", messageId)
        );
    }

    /**
     * Log file upload
     */
    public void logFileUpload(UUID userId, Long schoolId, UUID attachmentId, String filename, Long fileSize) {
        logActivity(
            userId,
            schoolId,
            "FILE_UPLOADED",
            String.format("Uploaded file %s (%s bytes) - ID: %s", filename, fileSize, attachmentId)
        );
    }

    /**
     * Log file download
     */
    public void logFileDownload(UUID userId, Long schoolId, UUID attachmentId, String filename) {
        logActivity(
            userId,
            schoolId,
            "FILE_DOWNLOADED",
            String.format("Downloaded file %s - ID: %s", filename, attachmentId)
        );
    }

    /**
     * Log conversation deletion
     */
    public void logConversationDeleted(UUID userId, Long schoolId, UUID conversationId) {
        logActivity(
            userId,
            schoolId,
            "CONVERSATION_DELETED",
            String.format("Deleted conversation %s", conversationId)
        );
    }

    /**
     * Log security violation
     */
    public void logSecurityViolation(UUID userId, Long schoolId, String violationType, String details) {
        logActivity(
            userId,
            schoolId,
            "SECURITY_VIOLATION_" + violationType,
            details
        );
    }
}
