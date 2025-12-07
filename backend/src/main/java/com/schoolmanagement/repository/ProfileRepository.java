package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    List<Profile> findBySchoolId(Long schoolId);
    Profile findByEmail(String email);
    
    /**
     * Find profile by user ID
     * @param userId the user UUID
     * @return Optional containing the profile if found
     */
    @Query("SELECT p FROM Profile p WHERE p.id = :userId")
    Optional<Profile> findByUserId(@Param("userId") UUID userId);
}
