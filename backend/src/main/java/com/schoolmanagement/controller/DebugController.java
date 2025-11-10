package com.schoolmanagement.controller;

import com.schoolmanagement.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Debug controller to help diagnose authentication and authorization issues
 */
@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DebugController {

    private final JwtUtil jwtUtil;

    public DebugController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    /**
     * Get current user's authentication details from JWT token
     */
    @GetMapping("/whoami")
    public ResponseEntity<Map<String, Object>> whoAmI(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        // Check if Authorization header exists
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.put("error", "No Authorization header or invalid format");
            response.put("authHeader", authHeader);
            return ResponseEntity.ok(response);
        }
        
        try {
            // Extract token
            String jwt = authHeader.substring(7);
            
            // Extract claims from JWT
            String email = jwtUtil.extractUsername(jwt);
            String role = jwtUtil.extractRole(jwt);
            String userId = jwtUtil.extractUserId(jwt);
            String schoolId = jwtUtil.extractSchoolId(jwt);
            
            response.put("tokenEmail", email);
            response.put("tokenRole", role);
            response.put("tokenUserId", userId);
            response.put("tokenSchoolId", schoolId);
            
            // Get Spring Security authentication details
            if (authentication != null) {
                response.put("authenticated", authentication.isAuthenticated());
                response.put("principal", authentication.getPrincipal());
                response.put("authorities", authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList()));
            } else {
                response.put("authenticated", false);
                response.put("authenticationObject", "null");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", "Failed to parse JWT: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }

    /**
     * Test endpoint for different roles
     */
    @GetMapping("/test-superadmin")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<Map<String, String>> testSuperadmin() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "✅ SUPERADMIN access granted");
        response.put("role", "SUPERADMIN");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-admin")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> testAdmin() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "✅ ADMIN access granted");
        response.put("role", "ADMIN");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-teacher")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, String>> testTeacher() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "✅ TEACHER access granted");
        response.put("role", "TEACHER");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test-student")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String, String>> testStudent() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "✅ STUDENT access granted");
        response.put("role", "STUDENT");
        return ResponseEntity.ok(response);
    }
}
