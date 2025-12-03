package com.schoolmanagement.repository;

import com.schoolmanagement.entity.ClassSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * ClassSubjectRepository
 * Repository interface for ClassSubject entity operations.
 * 
 * Sprint 1 - Ticket 6: Repository for class-subject-teacher mapping
 * Provides CRUD operations and custom queries for class subjects:
 * - Find all subjects for a class
 * - Find all classes where a teacher is assigned
 * - Find specific class-subject assignments
 */
@Repository
public interface ClassSubjectRepository extends JpaRepository<ClassSubject, UUID> {

    /**
     * Find all subjects assigned to a specific class
     */
    List<ClassSubject> findByClassId(UUID classId);

    /**
     * Find all class-subject assignments for a specific teacher
     */
    List<ClassSubject> findByTeacherId(UUID teacherId);

    /**
     * Find all class-subject assignments for a specific subject
     */
    List<ClassSubject> findBySubjectId(UUID subjectId);

    /**
     * Find a specific class-subject assignment
     */
    Optional<ClassSubject> findByClassIdAndSubjectId(UUID classId, UUID subjectId);

    /**
     * Check if a subject is already assigned to a class
     */
    boolean existsByClassIdAndSubjectId(UUID classId, UUID subjectId);

    /**
     * Delete all subject assignments for a class
     */
    void deleteByClassId(UUID classId);

    /**
     * Delete a specific class-subject assignment
     */
    void deleteByClassIdAndSubjectId(UUID classId, UUID subjectId);

    /**
     * Count subjects assigned to a class
     */
    long countByClassId(UUID classId);

    /**
     * Count classes where a teacher is assigned
     */
    long countByTeacherId(UUID teacherId);
    Optional<ClassSubject> findByClassIdAndSubjectIdAndTeacherId(UUID classId, UUID subjectId, UUID teacherId);

}
