package com.schoolmanagement.repository;

import com.schoolmanagement.entity.TeacherAttendance;
import com.schoolmanagement.entity.TeacherAttendance.AttendanceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository for TeacherAttendance entity
 * AC-02-03: Gestion des absences et retards des enseignants
 * Provides queries for attendance tracking and statistics
 */
@Repository
public interface TeacherAttendanceRepository extends JpaRepository<TeacherAttendance, UUID> {

    /**
     * Find all attendance records for a specific school
     */
    List<TeacherAttendance> findBySchoolIdOrderByEventDateDesc(Long schoolId);

    /**
     * Find all attendance records for a specific teacher
     */
    List<TeacherAttendance> findByTeacherIdOrderByEventDateDesc(UUID teacherId);

    /**
     * Find attendance records for a teacher within a date range
     */
    @Query("SELECT ta FROM TeacherAttendance ta WHERE ta.teacherId = :teacherId " +
           "AND ta.eventDate BETWEEN :startDate AND :endDate " +
           "ORDER BY ta.eventDate DESC")
    List<TeacherAttendance> findByTeacherIdAndDateRange(
            @Param("teacherId") UUID teacherId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find attendance records by school and date range
     */
    @Query("SELECT ta FROM TeacherAttendance ta WHERE ta.schoolId = :schoolId " +
           "AND ta.eventDate BETWEEN :startDate AND :endDate " +
           "ORDER BY ta.eventDate DESC")
    List<TeacherAttendance> findBySchoolIdAndDateRange(
            @Param("schoolId") Long schoolId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * Find attendance records by type (ABSENCE or RETARD)
     */
    List<TeacherAttendance> findBySchoolIdAndTypeOrderByEventDateDesc(Long schoolId, AttendanceType type);

    /**
     * Find attendance records for a specific class
     */
    List<TeacherAttendance> findByClassIdOrderByEventDateDesc(UUID classId);

    /**
     * Count total absences for a teacher
     */
    @Query("SELECT COUNT(ta) FROM TeacherAttendance ta " +
           "WHERE ta.teacherId = :teacherId AND ta.type = 'ABSENCE'")
    Long countAbsencesByTeacherId(@Param("teacherId") UUID teacherId);

    /**
     * Count total retards for a teacher
     */
    @Query("SELECT COUNT(ta) FROM TeacherAttendance ta " +
           "WHERE ta.teacherId = :teacherId AND ta.type = 'RETARD'")
    Long countRetardsByTeacherId(@Param("teacherId") UUID teacherId);

    /**
     * Count justified absences for a teacher
     */
    @Query("SELECT COUNT(ta) FROM TeacherAttendance ta " +
           "WHERE ta.teacherId = :teacherId AND ta.type = 'ABSENCE' AND ta.isJustified = true")
    Long countJustifiedAbsencesByTeacherId(@Param("teacherId") UUID teacherId);

    /**
     * Count unjustified absences for a teacher
     */
    @Query("SELECT COUNT(ta) FROM TeacherAttendance ta " +
           "WHERE ta.teacherId = :teacherId AND ta.type = 'ABSENCE' AND ta.isJustified = false")
    Long countUnjustifiedAbsencesByTeacherId(@Param("teacherId") UUID teacherId);

    /**
     * Count justified retards for a teacher
     */
    @Query("SELECT COUNT(ta) FROM TeacherAttendance ta " +
           "WHERE ta.teacherId = :teacherId AND ta.type = 'RETARD' AND ta.isJustified = true")
    Long countJustifiedRetardsByTeacherId(@Param("teacherId") UUID teacherId);

    /**
     * Count unjustified retards for a teacher
     */
    @Query("SELECT COUNT(ta) FROM TeacherAttendance ta " +
           "WHERE ta.teacherId = :teacherId AND ta.type = 'RETARD' AND ta.isJustified = false")
    Long countUnjustifiedRetardsByTeacherId(@Param("teacherId") UUID teacherId);

    /**
     * Get monthly statistics for a teacher and year
     */
    @Query("SELECT TO_CHAR(ta.eventDate, 'YYYY-MM') as month, " +
           "SUM(CASE WHEN ta.type = 'ABSENCE' THEN 1 ELSE 0 END) as absences, " +
           "SUM(CASE WHEN ta.type = 'RETARD' THEN 1 ELSE 0 END) as retards " +
           "FROM TeacherAttendance ta " +
           "WHERE ta.teacherId = :teacherId " +
           "AND EXTRACT(YEAR FROM ta.eventDate) = :year " +
           "GROUP BY TO_CHAR(ta.eventDate, 'YYYY-MM') " +
           "ORDER BY month")
    List<Object[]> getMonthlyStatsByTeacherAndYear(
            @Param("teacherId") UUID teacherId,
            @Param("year") int year
    );

    /**
     * Get monthly statistics for entire school
     */
    @Query("SELECT TO_CHAR(ta.eventDate, 'YYYY-MM') as month, " +
           "SUM(CASE WHEN ta.type = 'ABSENCE' THEN 1 ELSE 0 END) as absences, " +
           "SUM(CASE WHEN ta.type = 'RETARD' THEN 1 ELSE 0 END) as retards " +
           "FROM TeacherAttendance ta " +
           "WHERE ta.schoolId = :schoolId " +
           "AND EXTRACT(YEAR FROM ta.eventDate) = :year " +
           "GROUP BY TO_CHAR(ta.eventDate, 'YYYY-MM') " +
           "ORDER BY month")
    List<Object[]> getMonthlyStatsBySchoolAndYear(
            @Param("schoolId") Long schoolId,
            @Param("year") int year
    );

    /**
     * Find recent attendance events for a teacher (limit 10)
     */
    List<TeacherAttendance> findTop10ByTeacherIdOrderByEventDateDesc(UUID teacherId);

    /**
     * Find recent attendance events for a school (limit 20)
     */
    List<TeacherAttendance> findTop20BySchoolIdOrderByEventDateDesc(Long schoolId);

    /**
     * Check if attendance exists for a teacher on a specific date
     */
    boolean existsByTeacherIdAndEventDateAndType(UUID teacherId, LocalDate eventDate, AttendanceType type);
}
