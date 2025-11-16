package com.schoolmanagement.config;

import com.schoolmanagement.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Add security headers
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; frame-ancestors 'none'; form-action 'self';")
                )
                .frameOptions(frame -> frame.deny())
                .xssProtection(xss -> xss.disable()) // Modern browsers have built-in XSS protection
                .contentTypeOptions(contentType -> contentType.disable())
            )
            
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - Authentication
                .requestMatchers("/api/auth/login", "/api/auth/signup-admin", "/api/auth/register").permitAll()
                
                // Public endpoints - School discovery (GET only)
                .requestMatchers(request -> 
                    "GET".equals(request.getMethod()) && 
                    (request.getServletPath().equals("/api/schools") ||
                     request.getServletPath().matches("/api/schools/\\d+") ||
                     request.getServletPath().startsWith("/api/schools/by-city/") ||
                     request.getServletPath().startsWith("/api/schools/by-region/"))
                ).permitAll()
                
                // SuperAdmin-only endpoints
                .requestMatchers("/api/superadmin/**").hasRole("SUPERADMIN")
                
                // School management - SUPERADMIN only for modifications
                .requestMatchers(request -> 
                    ("POST".equals(request.getMethod()) || 
                     "PUT".equals(request.getMethod()) || 
                     "DELETE".equals(request.getMethod())) && 
                    request.getServletPath().startsWith("/api/schools")
                ).hasRole("SUPERADMIN")
                
                // Admin and above
                .requestMatchers("/api/students/**").hasAnyRole("SUPERADMIN", "ADMIN", "TEACHER", "STUDENT")
                .requestMatchers("/api/classes/**").hasAnyRole("SUPERADMIN", "ADMIN", "TEACHER")
                .requestMatchers("/api/teachers/**").hasAnyRole("SUPERADMIN", "ADMIN", "TEACHER")
                
                // Authenticated users - require proper authorization
                .requestMatchers("/api/messages/**").authenticated()
                .requestMatchers("/api/resources/**").authenticated()
                .requestMatchers("/api/activities/**").authenticated()
                
                // Activity files - download endpoint is public (students need access without auth)
                .requestMatchers("/api/activity-files/download/**").permitAll()
                .requestMatchers("/api/activity-files/**").authenticated()
                
                .requestMatchers("/api/storage/**").authenticated()
                .requestMatchers("/api/sessions/**").authenticated()
                .requestMatchers("/api/diagnostic-sessions/**").authenticated()
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Restrict to specific origins - UPDATE THESE FOR PRODUCTION
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:80",   // Frontend nginx (host port)
            "http://localhost:5173",   // Vite dev server
            "http://localhost:3000",   // Alternative dev port
            "http://frontend:5173",    // Docker frontend
            "http://57.129.110.129:80", // VPS IP with frontend port
            "http://57.129.110.129",
            "http://pedagoria.com",
            "https://pedagoria.com",
            "http://pedagoria.com:80",
            "https://pedagoria.com:80"
            
            
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Restrict headers to necessary ones
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "X-Requested-With"
        ));
        
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
