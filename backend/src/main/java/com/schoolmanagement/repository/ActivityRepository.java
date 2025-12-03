package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {

    // Méthodes existantes
    List<Activity> findBySchoolId(Long schoolId);
    List<Activity> findByType(String type);
    List<Activity> findBySchoolIdAndClassId(Long schoolId, UUID classId);
    List<Activity> findBySchoolIdAndApprovalStatus(Long schoolId, String approvalStatus);
    List<Activity> findBySchoolIdAndClassIdAndApprovalStatus(Long schoolId, UUID classId, String approvalStatus);
    List<Activity> findByNatureAndApprovalStatus(String nature, String approvalStatus);
    List<Activity> findBySubjectIdAndNatureAndApprovalStatus(UUID subjectId, String nature, String approvalStatus);
    List<Activity> findByCreatedBy(UUID createdBy);

    // 🆕 VERSION 1: Requête JPQL simplifiée (essayez celle-ci d'abord)
    @Query("""
        SELECT a FROM Activity a
        WHERE EXISTS (
            SELECT 1 FROM ClassSubject cs
            WHERE cs.classId = a.classId
            AND cs.subjectId = a.subjectId
            AND cs.teacherId = :teacherId
        )
        AND a.schoolId = :schoolId
        ORDER BY a.createdAt DESC
        """)
    List<Activity> findActivitiesByTeacherAssignments(
        @Param("teacherId") UUID teacherId,
        @Param("schoolId") Long schoolId
    );

    // 🆕 VERSION 2: Avec statut d'approbation
    @Query("""
        SELECT a FROM Activity a
        WHERE EXISTS (
            SELECT 1 FROM ClassSubject cs
            WHERE cs.classId = a.classId
            AND cs.subjectId = a.subjectId
            AND cs.teacherId = :teacherId
        )
        AND a.schoolId = :schoolId
        AND a.approvalStatus = :status
        ORDER BY a.createdAt DESC
        """)
    List<Activity> findActivitiesByTeacherAssignmentsAndStatus(
        @Param("teacherId") UUID teacherId,
        @Param("schoolId") Long schoolId,
        @Param("status") String status
    );

    // 🆕 VERSION 3: Pour une classe spécifique
    @Query("""
        SELECT a FROM Activity a
        WHERE EXISTS (
            SELECT 1 FROM ClassSubject cs
            WHERE cs.classId = a.classId
            AND cs.subjectId = a.subjectId
            AND cs.teacherId = :teacherId
            AND cs.classId = :classId
        )
        AND a.schoolId = :schoolId
        ORDER BY a.createdAt DESC
        """)
    List<Activity> findActivitiesByTeacherAndClass(
        @Param("teacherId") UUID teacherId,
        @Param("classId") UUID classId,
        @Param("schoolId") Long schoolId
    );

    // 🆕 VERSION ALTERNATIVE: Requête native avec cast UUID
    @Query(value = """
        SELECT a.* FROM activities a
        INNER JOIN class_subjects cs 
            ON a.class_id = cs.class_id 
            AND a.subject_id = cs.subject_id
        WHERE cs.teacher_id = CAST(:teacherId AS uuid)
        AND a.school_id = :schoolId
        ORDER BY a.created_at DESC
        """, nativeQuery = true)
    List<Activity> findActivitiesByTeacherAssignmentsNative(
        @Param("teacherId") String teacherId,
        @Param("schoolId") Long schoolId
    );
    
    // 🆕 Avec statut - version native
    @Query(value = """
        SELECT a.* FROM activities a
        INNER JOIN class_subjects cs 
            ON a.class_id = cs.class_id 
            AND a.subject_id = cs.subject_id
        WHERE cs.teacher_id = CAST(:teacherId AS uuid)
        AND a.school_id = :schoolId
        AND a.approval_status = :status
        ORDER BY a.created_at DESC
        """, nativeQuery = true)
    List<Activity> findActivitiesByTeacherAssignmentsAndStatusNative(
        @Param("teacherId") String teacherId,
        @Param("schoolId") Long schoolId,
        @Param("status") String status
    );
    
    // 🆕 Pour une classe - version native
    @Query(value = """
        SELECT a.* FROM activities a
        INNER JOIN class_subjects cs 
            ON a.class_id = cs.class_id 
            AND a.subject_id = cs.subject_id
        WHERE cs.teacher_id = CAST(:teacherId AS uuid)
        AND cs.class_id = CAST(:classId AS uuid)
        AND a.school_id = :schoolId
        ORDER BY a.created_at DESC
        """, nativeQuery = true)
    List<Activity> findActivitiesByTeacherAndClassNative(
        @Param("teacherId") String teacherId,
        @Param("classId") String classId,
        @Param("schoolId") Long schoolId
    );
    List<Activity> findByClassIdAndSubjectIdAndApprovedBy(UUID classId, UUID subjectId, UUID approvedBy);
        List<Activity> findByClassIdAndSubjectId(UUID classId, UUID subjectId);
    @Query("SELECT a FROM Activity a WHERE a.classId IN :classIds AND a.subjectId IN :subjectIds")
List<Activity> findByClassIdInAndSubjectIdIn(
    @Param("classIds") List<UUID> classIds,
    @Param("subjectIds") List<UUID> subjectIds
);    

}