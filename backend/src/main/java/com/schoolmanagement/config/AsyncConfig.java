package com.schoolmanagement.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enable asynchronous execution for non-blocking operations.
 * Used for audit logging and file processing.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Spring Boot auto-configures the async executor
    // Custom configuration can be added here if needed
}
