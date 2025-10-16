package com.schoolmanagement.service;

import com.schoolmanagement.model.Profile;
import com.schoolmanagement.model.UserRole;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final ProfileRepository profileRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Profile profile = profileRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        List<UserRole> roles = userRoleRepository.findByUserId(profile.getId());
        List<SimpleGrantedAuthority> authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRole().name().toUpperCase()))
                .collect(Collectors.toList());

        // Note: In production, you would have a password field in your database
        // For now, using a placeholder password
        return User.builder()
                .username(profile.getEmail())
                .password("") // Password will be handled separately
                .authorities(authorities)
                .build();
    }
}
