package com.schoolmanagement.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Logs request metadata for multipart endpoints to help diagnose multipart parsing issues
 * (e.g., missing boundary, truncated body, proxy issues).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@Slf4j
public class MultipartEndpointLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();

        boolean isMultipartEndpoint = "POST".equalsIgnoreCase(request.getMethod())
            && ("/api/messaging/enhanced".equals(uri)
                || "/api/messaging/attachments/upload".equals(uri));

        if (isMultipartEndpoint && log.isDebugEnabled()) {
            log.debug(
                "Multipart endpoint request: method={}, uri={}, contentType={}, contentLength={}, transferEncoding={}, userAgent={}",
                request.getMethod(),
                uri,
                request.getContentType(),
                request.getContentLengthLong(),
                request.getHeader("Transfer-Encoding"),
                request.getHeader("User-Agent")
            );
        }

        filterChain.doFilter(request, response);
    }
}
