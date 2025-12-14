package com.schoolmanagement.security;

import com.schoolmanagement.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorization = accessor.getFirstNativeHeader("Authorization");
            if (authorization == null || !authorization.startsWith("Bearer ")) {
                throw new AccessDeniedException("Missing JWT token");
            }

            String token = authorization.substring("Bearer ".length()).trim();
            try {
                String email = jwtUtil.extractUsername(token);
                if (!Boolean.TRUE.equals(jwtUtil.validateToken(token, email))) {
                    throw new AccessDeniedException("Invalid JWT token");
                }

                String userId = jwtUtil.extractUserId(token);
                String role = jwtUtil.extractRole(token);

                List<SimpleGrantedAuthority> authorities = role == null
                        ? List.of()
                        : List.of(new SimpleGrantedAuthority("ROLE_" + role));

                accessor.setUser(new UsernamePasswordAuthenticationToken(userId, null, authorities));
            } catch (Exception ex) {
                throw new AccessDeniedException("Invalid JWT token");
            }
        }

        return message;
    }
}
