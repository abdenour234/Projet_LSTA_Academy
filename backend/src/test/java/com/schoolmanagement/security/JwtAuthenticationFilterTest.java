package com.schoolmanagement.security;

import com.schoolmanagement.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private PrintWriter printWriter;

    @InjectMocks
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final String INVALID_TOKEN = "invalid.jwt.token";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_ROLE = "admin";
    private static final String TEST_USER_ID = UUID.randomUUID().toString();

    @BeforeEach
    void setUp() {
        // Clear security context before each test
        SecurityContextHolder.clearContext();
    }

    @Test
    void shouldAllowRequestWithoutAuthorizationHeader() throws ServletException, IOException {
        // Given
        when(request.getHeader("Authorization")).thenReturn(null);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldAllowRequestWithInvalidAuthorizationHeaderFormat() throws ServletException, IOException {
        // Given
        when(request.getHeader("Authorization")).thenReturn("Invalid header");

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldAuthenticateValidJwtToken() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + VALID_TOKEN;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenReturn(TEST_EMAIL);
        when(jwtUtil.validateToken(VALID_TOKEN, TEST_EMAIL)).thenReturn(true);
        when(jwtUtil.extractRole(VALID_TOKEN)).thenReturn(TEST_ROLE);
        when(jwtUtil.extractUserId(VALID_TOKEN)).thenReturn(TEST_USER_ID);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertEquals(TEST_EMAIL, authentication.getPrincipal());
        assertTrue(authentication.getAuthorities().contains(
            new SimpleGrantedAuthority("ROLE_" + TEST_ROLE.toUpperCase())
        ));
    }

    @Test
    void shouldSetCorrectRoleAuthority() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + VALID_TOKEN;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenReturn(TEST_EMAIL);
        when(jwtUtil.validateToken(VALID_TOKEN, TEST_EMAIL)).thenReturn(true);
        when(jwtUtil.extractRole(VALID_TOKEN)).thenReturn("superadmin");
        when(jwtUtil.extractUserId(VALID_TOKEN)).thenReturn(TEST_USER_ID);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication);
        assertTrue(authentication.getAuthorities().contains(
            new SimpleGrantedAuthority("ROLE_SUPERADMIN")
        ));
    }

    @Test
    void shouldRejectInvalidToken() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + INVALID_TOKEN;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(INVALID_TOKEN)).thenReturn(TEST_EMAIL);
        when(jwtUtil.validateToken(INVALID_TOKEN, TEST_EMAIL)).thenReturn(false);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldHandleExpiredJwtException() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + VALID_TOKEN;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenThrow(new ExpiredJwtException(null, null, "Token expired"));
        when(response.getWriter()).thenReturn(printWriter);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(printWriter).write("{\"error\": \"Token expired\"}");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldHandleSignatureException() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + VALID_TOKEN;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenThrow(new SignatureException("Invalid signature"));
        when(response.getWriter()).thenReturn(printWriter);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(printWriter).write("{\"error\": \"Invalid token signature\"}");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldHandleMalformedJwtException() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + VALID_TOKEN;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenThrow(new MalformedJwtException("Malformed token"));
        when(response.getWriter()).thenReturn(printWriter);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(printWriter).write("{\"error\": \"Malformed token\"}");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldHandleGenericException() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + VALID_TOKEN;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenThrow(new RuntimeException("Unexpected error"));
        when(response.getWriter()).thenReturn(printWriter);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(printWriter).write("{\"error\": \"Authentication failed\"}");
        verify(filterChain, never()).doFilter(any(), any());
    }

    @Test
    void shouldNotAuthenticateWhenEmailIsNull() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + VALID_TOKEN;
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenReturn(null);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void shouldNotReAuthenticateWhenAlreadyAuthenticated() throws ServletException, IOException {
        // Given
        String authHeader = "Bearer " + VALID_TOKEN;
        Authentication existingAuth = mock(Authentication.class);
        SecurityContextHolder.getContext().setAuthentication(existingAuth);
        
        when(request.getHeader("Authorization")).thenReturn(authHeader);
        when(jwtUtil.extractUsername(VALID_TOKEN)).thenReturn(TEST_EMAIL);

        // When
        jwtAuthenticationFilter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        verify(jwtUtil, never()).validateToken(anyString(), anyString());
        assertEquals(existingAuth, SecurityContextHolder.getContext().getAuthentication());
    }
}
