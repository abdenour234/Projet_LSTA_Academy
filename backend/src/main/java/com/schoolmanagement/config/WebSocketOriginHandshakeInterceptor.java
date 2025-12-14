package com.schoolmanagement.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@Slf4j
public class WebSocketOriginHandshakeInterceptor implements HandshakeInterceptor {

    @Value("${messaging.websocket.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, java.util.Map<String, Object> attributes) {
        Set<String> allow = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());

        if (allow.contains("*")) {
            return true;
        }

        String origin = request.getHeaders().getOrigin();
        if (origin == null || origin.isBlank()) {
            log.warn("WebSocket handshake blocked: missing Origin header");
            return false;
        }

        boolean ok = allow.contains(origin);
        if (!ok) {
            log.warn("WebSocket handshake blocked: origin {} not allowed", origin);
        }
        return ok;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}
