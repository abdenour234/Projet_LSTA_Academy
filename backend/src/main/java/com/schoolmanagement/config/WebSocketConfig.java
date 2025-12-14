package com.schoolmanagement.config;

import com.schoolmanagement.security.JwtChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

/**
 * WebSocket configuration for real-time messaging notifications.
 * Enables STOMP protocol over WebSocket with fallback to SockJS.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtChannelInterceptor jwtChannelInterceptor;
    private final WebSocketOriginHandshakeInterceptor webSocketOriginHandshakeInterceptor;

    @Value("${messaging.websocket.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple broker for topics and queues
        config.enableSimpleBroker("/topic", "/queue");
        
        // Prefix for messages from client to server
        config.setApplicationDestinationPrefixes("/app");
        
        // Prefix for user-specific destinations
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] originPatterns = Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toArray(String[]::new);

        // Register STOMP endpoint with SockJS fallback
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(originPatterns.length == 0 ? new String[] {"*"} : originPatterns)
            .addInterceptors(webSocketOriginHandshakeInterceptor)
            .withSockJS();
        
        // Native WebSocket endpoint (without SockJS)
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(originPatterns.length == 0 ? new String[] {"*"} : originPatterns)
            .addInterceptors(webSocketOriginHandshakeInterceptor);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }
}
