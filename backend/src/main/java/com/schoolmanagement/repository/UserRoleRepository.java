package com.schoolmanagement.repository;

import com.schoolmanagement.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    List<UserRole> findByUserId(UUID userId);
    List<UserRole> findByRole(UserRole.Role role);
    List<UserRole> findByUserIdInAndRole(List<UUID> userIds, UserRole.Role role);
    UserRole findByUserIdAndRole(UUID userId, UserRole.Role role);
}
