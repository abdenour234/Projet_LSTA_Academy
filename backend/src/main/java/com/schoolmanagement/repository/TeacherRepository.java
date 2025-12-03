package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * TeacherRepository
 * Repository interface for Teacher entity operations.
 * 
 * Sprint 1 - Ticket 6: Repository for teacher management
 * Provides CRUD operations and custom queries for teachers:
 * - Find teachers by school
 * - Find teachers by specialty
 * - Find teacher by profile ID
 */
@Repository
public interface TeacherRepository extends JpaRepository<Teacher, UUID> {

    /**
     * Find all teachers for a specific school
     */
    List<Teacher> findBySchoolId(Long schoolId);

    /**
     * Find all active teachers for a specific school
     */
    List<Teacher> findBySchoolIdAndIsActiveTrue(Long schoolId);

    /**
     * Find teachers by specialty within a school
     */
    List<Teacher> findBySchoolIdAndSpecialty(Long schoolId, String specialty);

    /**
     * Find active teachers by specialty within a school
     */
    List<Teacher> findBySchoolIdAndSpecialtyAndIsActiveTrue(Long schoolId, String specialty);

    /**
     * Find a teacher by their profile ID
     */
    Optional<Teacher> findByProfileId(UUID profileId);

    /**
     * Check if a teacher exists for a given profile
     */
    boolean existsByProfileId(UUID profileId);

    /**
     * Count active teachers for a school
     */
    long countBySchoolIdAndIsActiveTrue(Long schoolId);

    @Query("SELECT t FROM Teacher t WHERE t.id = :id OR t.profileId = :id")
    Optional<Teacher> findByIdOrProfileId(@Param("id") UUID id);
}
