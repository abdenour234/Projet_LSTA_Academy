package com.schoolmanagement.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.TransactionSystemException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the application.
 * Handles various exceptions and returns appropriate HTTP responses.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handles access denied exceptions (403 Forbidden).
     * This occurs when a user attempts to access a resource they don't have permission for.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        
        Map<String, Object> error = new HashMap<>();
        error.put("error", "Access Denied");
        error.put("message", "You don't have permission to access this resource");
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handles data integrity violations (e.g., unique constraint violations).
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.error("Data integrity violation: ", ex);
        
        Map<String, Object> error = new HashMap<>();
        String message = ex.getMessage();
        String rootCauseMessage = ex.getRootCause() != null ? ex.getRootCause().getMessage() : "";
        String fullMessage = (message + " " + rootCauseMessage).toLowerCase();
        
        // Check for common constraint violations
        if (fullMessage.contains("unique") || fullMessage.contains("duplicate")) {
            if (fullMessage.contains("email")) {
                error.put("error", "Un compte avec cet email existe déjà");
            } else if (fullMessage.contains("massar") || fullMessage.contains("idx_students_massar")) {
                error.put("error", "Un étudiant avec ce code MASSAR existe déjà");
            } else if (fullMessage.contains("user_id")) {
                error.put("error", "Cet identifiant utilisateur est déjà utilisé");
            } else {
                error.put("error", "Cet enregistrement existe déjà dans la base de données");
            }
        } else if (fullMessage.contains("foreign key") || fullMessage.contains("violates")) {
            if (fullMessage.contains("class_id")) {
                error.put("error", "La classe spécifiée n'existe pas");
            } else if (fullMessage.contains("school_id")) {
                error.put("error", "L'école spécifiée n'existe pas");
            } else {
                error.put("error", "Référence invalide. Veuillez vérifier les données liées.");
            }
        } else if (fullMessage.contains("not-null") || fullMessage.contains("null value")) {
            error.put("error", "Champ obligatoire manquant. Veuillez remplir tous les champs requis.");
        } else {
            error.put("error", "Violation de contrainte de base de données. Veuillez vérifier votre saisie.");
        }
        
        // Add detailed error for debugging (only in logs, not sent to client)
        log.error("Constraint violation details: {}", fullMessage);
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handles transaction system exceptions (e.g., rollback-only transactions).
     */
    @ExceptionHandler(TransactionSystemException.class)
    public ResponseEntity<Map<String, Object>> handleTransactionSystemException(TransactionSystemException ex) {
        log.error("Transaction system exception: ", ex);
        
        Map<String, Object> error = new HashMap<>();
        error.put("error", "Transaction failed. Please try again.");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    /**
     * Handles generic runtime exceptions.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.error("Runtime exception: ", ex);
        
        Map<String, Object> error = new HashMap<>();
        
        // Extract meaningful error message
        String message = ex.getMessage();
        if (message != null && !message.isEmpty()) {
            error.put("error", message);
        } else {
            error.put("error", "An unexpected error occurred. Please try again.");
        }
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    /**
     * Handles all other exceptions.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        log.error("Unexpected exception: ", ex);
        
        Map<String, Object> error = new HashMap<>();
        error.put("error", "An unexpected error occurred. Please contact support.");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
