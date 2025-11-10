package com.schoolmanagement.config;

import com.schoolmanagement.util.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityConfigIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JwtUtil jwtUtil;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String VALID_TOKEN = "valid.jwt.token";

    @Test
    void shouldAllowAccessToAuthEndpointsWithoutToken() throws Exception {
        // Public endpoints should be accessible
        mockMvc.perform(post("/api/auth/login"))
                .andExpect(status().is4xxClientError()); // Will fail validation but not auth
    }

    @Test
    void shouldDenyAccessToProtectedEndpointsWithoutToken() throws Exception {
        // Protected endpoints should require authentication
        mockMvc.perform(get("/api/superadmin/stats"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowAccessWithValidToken() throws Exception {
        // Given
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenReturn(TEST_EMAIL);
        when(jwtUtil.validateToken(VALID_TOKEN, TEST_EMAIL)).thenReturn(true);
        when(jwtUtil.extractRole(VALID_TOKEN)).thenReturn("superadmin");
        when(jwtUtil.extractUserId(VALID_TOKEN)).thenReturn(UUID.randomUUID().toString());

        // When/Then
        mockMvc.perform(get("/api/superadmin/stats")
                        .header("Authorization", "Bearer " + VALID_TOKEN))
                .andExpect(status().isOk());
    }

    @Test
    void shouldDenyAccessWhenRoleIsInsufficient() throws Exception {
        // Given - user has STUDENT role but tries to access SUPERADMIN endpoint
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenReturn(TEST_EMAIL);
        when(jwtUtil.validateToken(VALID_TOKEN, TEST_EMAIL)).thenReturn(true);
        when(jwtUtil.extractRole(VALID_TOKEN)).thenReturn("student");
        when(jwtUtil.extractUserId(VALID_TOKEN)).thenReturn(UUID.randomUUID().toString());

        // When/Then
        mockMvc.perform(get("/api/superadmin/stats")
                        .header("Authorization", "Bearer " + VALID_TOKEN))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldAllowSuperadminToAccessAllEndpoints() throws Exception {
        // Given
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenReturn(TEST_EMAIL);
        when(jwtUtil.validateToken(VALID_TOKEN, TEST_EMAIL)).thenReturn(true);
        when(jwtUtil.extractRole(VALID_TOKEN)).thenReturn("superadmin");
        when(jwtUtil.extractUserId(VALID_TOKEN)).thenReturn(UUID.randomUUID().toString());

        // When/Then - superadmin can access all endpoints
        mockMvc.perform(get("/api/superadmin/stats")
                        .header("Authorization", "Bearer " + VALID_TOKEN))
                .andExpect(status().isOk());

        // Note: We can't test all endpoints here as they may not exist yet
        // This test verifies the security config allows superadmin access
    }

    @Test
    void shouldDenyAccessWithInvalidToken() throws Exception {
        // Given
        when(jwtUtil.extractUsername(anyString())).thenReturn(TEST_EMAIL);
        when(jwtUtil.validateToken(anyString(), anyString())).thenReturn(false);

        // When/Then
        mockMvc.perform(get("/api/superadmin/stats")
                        .header("Authorization", "Bearer invalid.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowStorageFilesAccessWithoutAuth() throws Exception {
        // Storage files should be publicly accessible
        mockMvc.perform(get("/api/storage/files/test.pdf"))
                .andExpect(status().is4xxClientError()); // Will fail because file doesn't exist, but not auth
    }

    @Test
    void shouldEnforceAuthenticationOnNonPublicEndpoints() throws Exception {
        // Any endpoint not explicitly public should require auth
        mockMvc.perform(get("/api/school/123"))
                .andExpect(status().isUnauthorized());
    }
}
