package com.schoolmanagement.util;

import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.util.regex.Pattern;

/**
 * Input sanitization utility to prevent XSS, SQL injection, and other security issues.
 */
@Component
public class InputSanitizer {

    // Pattern to detect potential SQL injection attempts
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(?i).*((union.*select)|(insert.*into)|(delete.*from)|(drop.*table)|(--)|" +
        "(;.*--)|(exec(\\s|\\+)+(s|x)p\\w+)|(script.*>)|(javascript:)|(onerror\\s*=)).*"
    );

    // Pattern to detect potential XSS attempts
    private static final Pattern XSS_PATTERN = Pattern.compile(
        "(?i).*(<script|<iframe|<object|<embed|javascript:|onerror|onload|onclick).*"
    );

    /**
     * Sanitize text input for HTML output
     * Encodes HTML special characters to prevent XSS
     */
    public String sanitizeForHtml(String input) {
        if (input == null) {
            return null;
        }
        return HtmlUtils.htmlEscape(input.trim());
    }

    /**
     * Sanitize text input for JavaScript context
     */
    public String sanitizeForJavaScript(String input) {
        if (input == null) {
            return null;
        }
        return HtmlUtils.htmlEscapeDecimal(input.trim());
    }

    /**
     * Sanitize input for SQL queries (though using prepared statements is better)
     * This is a defense-in-depth measure
     */
    public String sanitizeForSql(String input) {
        if (input == null) {
            return null;
        }
        
        String sanitized = input.trim();
        
        // Check for SQL injection patterns
        if (SQL_INJECTION_PATTERN.matcher(sanitized).matches()) {
            throw new IllegalArgumentException("Input contains potentially malicious SQL patterns");
        }
        
        return sanitized;
    }

    /**
     * Sanitize general text input
     * Removes dangerous characters and patterns
     */
    public String sanitizeText(String input) {
        if (input == null) {
            return null;
        }
        
        String sanitized = input.trim();
        
        // Check for XSS patterns
        if (XSS_PATTERN.matcher(sanitized).matches()) {
            throw new IllegalArgumentException("Input contains potentially malicious scripts");
        }
        
        return HtmlUtils.htmlEscape(sanitized);
    }

    /**
     * Sanitize email input
     */
    public String sanitizeEmail(String email) {
        if (email == null) {
            return null;
        }
        
        String sanitized = email.trim().toLowerCase();
        
        // Basic email validation
        if (!sanitized.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new IllegalArgumentException("Invalid email format");
        }
        
        return sanitized;
    }

    /**
     * Sanitize filename for file uploads
     */
    public String sanitizeFilename(String filename) {
        if (filename == null) {
            return null;
        }
        
        // Remove path traversal attempts
        String sanitized = filename.replaceAll("\\.\\./", "")
                                   .replaceAll("\\.\\\\", "")
                                   .replaceAll("[^a-zA-Z0-9._-]", "_");
        
        return sanitized.trim();
    }

    /**
     * Sanitize URL input
     */
    public String sanitizeUrl(String url) {
        if (url == null) {
            return null;
        }
        
        String sanitized = url.trim();
        
        // Only allow http and https protocols
        if (!sanitized.matches("^https?://.*")) {
            throw new IllegalArgumentException("Only HTTP/HTTPS URLs are allowed");
        }
        
        return HtmlUtils.htmlEscape(sanitized);
    }

    /**
     * Validate and sanitize UUID string
     */
    public String sanitizeUuid(String uuid) {
        if (uuid == null) {
            return null;
        }
        
        String sanitized = uuid.trim();
        
        if (!sanitized.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")) {
            throw new IllegalArgumentException("Invalid UUID format");
        }
        
        return sanitized;
    }

    /**
     * Check if input contains malicious patterns
     */
    public boolean isMalicious(String input) {
        if (input == null) {
            return false;
        }
        
        return SQL_INJECTION_PATTERN.matcher(input).matches() || 
               XSS_PATTERN.matcher(input).matches();
    }

    /**
     * Sanitize numeric input (allow only digits)
     */
    public String sanitizeNumeric(String input) {
        if (input == null) {
            return null;
        }
        
        return input.trim().replaceAll("[^0-9]", "");
    }

    /**
     * Sanitize alphanumeric input
     */
    public String sanitizeAlphanumeric(String input) {
        if (input == null) {
            return null;
        }
        
        return input.trim().replaceAll("[^a-zA-Z0-9]", "");
    }
}
