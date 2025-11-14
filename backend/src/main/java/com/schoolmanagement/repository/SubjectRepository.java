package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * SubjectRepository
 * Repository interface for Subject entity operations.
 * 
 * Sprint 1 - Ticket 6: Repository for subject management
 * Provides CRUD operations and custom queries for subjects:
 * - Find all subjects for a school
 * - Find active subjects for a school
 * - Find subject by name within a school
 */
@Repository
public interface SubjectRepository extends JpaRepository<Subject, UUID> {

    /**
     * Find all subjects for a specific school
     */
    List<Subject> findBySchoolId(Long schoolId);

    /**
     * Find all active subjects for a specific school
     */
    List<Subject> findBySchoolIdAndIsActiveTrue(Long schoolId);

    /**
     * Find a subject by name within a specific school
     */
    Optional<Subject> findBySchoolIdAndName(Long schoolId, String name);

    /**
     * Check if a subject exists with the given name in a school
     */
    boolean existsBySchoolIdAndName(Long schoolId, String name);

    /**
     * Count active subjects for a school
     */
    long countBySchoolIdAndIsActiveTrue(Long schoolId);
}
