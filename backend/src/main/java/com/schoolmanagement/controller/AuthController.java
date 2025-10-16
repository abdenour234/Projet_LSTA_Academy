package com.schoolmanagement.controller;

import com.schoolmanagement.dto.AuthRequest;
import com.schoolmanagement.dto.AuthResponse;
import com.schoolmanagement.dto.UserInfoResponse;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.UserRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import com.schoolmanagement.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtUtil jwtUtil;
    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return ResponseEntity.ok(new AuthResponse(token, userDetails.getUsername()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> getCurrentUser(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String email = userDetails.getUsername();

            // Get profile
            Profile profile = profileRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Profile not found"));

            // Get roles
            List<UserRole> userRoles = userRoleRepository.findByUserId(profile.getId());
            List<String> roles = userRoles.stream()
                    .map(ur -> ur.getRole().name().toUpperCase())
                    .collect(Collectors.toList());

            UserInfoResponse response = new UserInfoResponse(
                    profile.getId(),
                    profile.getEmail(),
                    profile.getFullName(),
                    profile.getSchoolId(),
                    roles
            );

            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(401).build();
    }
}
