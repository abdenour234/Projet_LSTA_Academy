package com.schoolmanagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Optional virus scanning integration.
 *
 * Default behavior is a no-op (returns CLEAN when enabled flag is false).
 * Replace the implementation with ClamAV/cloud scanning as needed.
 */
@Service
public class VirusScanningService {

    @Value("${messaging.attachments.antivirus-enabled:false}")
    private boolean virusScanEnabled;

    public ScanResult scan(UUID attachmentId, String objectKey) {
        if (!virusScanEnabled) {
            return ScanResult.SKIPPED;
        }

        // Placeholder: integrate real scanner.
        return ScanResult.CLEAN;
    }

    public enum ScanResult {
        CLEAN,
        INFECTED,
        SKIPPED
    }
}
