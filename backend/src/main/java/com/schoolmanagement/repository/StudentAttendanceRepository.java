package com.schoolmanagement.repository;

import com.schoolmanagement.entity.HistoriqueProfesseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface StudentAttendanceRepository extends JpaRepository<HistoriqueProfesseur, UUID> {

    // Trouver toutes les absences d'une classe pour une école
    List<HistoriqueProfesseur> findBySchoolIdAndClassIdOrderByEventDateDesc(Long schoolId, UUID classId);

    // Trouver les absences d'un étudiant spécifique
    List<HistoriqueProfesseur> findBySchoolIdAndStudentIdOrderByEventDateDesc(Long schoolId, UUID studentId);

    // Trouver les absences par enseignant (pour vérifier les permissions)
    List<HistoriqueProfesseur> findBySchoolIdAndTeacherIdOrderByEventDateDesc(Long schoolId, UUID teacherId);

    // Trouver les absences par classe et période
    @Query("SELECT h FROM HistoriqueProfesseur h WHERE h.schoolId = :schoolId AND h.classId = :classId " +
           "AND h.eventDate BETWEEN :startDate AND :endDate ORDER BY h.eventDate DESC")
    List<HistoriqueProfesseur> findByClassAndDateRange(
        @Param("schoolId") Long schoolId,
        @Param("classId") UUID classId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    // Compter les absences par étudiant
    @Query("SELECT COUNT(h) FROM HistoriqueProfesseur h WHERE h.schoolId = :schoolId " +
           "AND h.studentId = :studentId AND h.eventType = 'ABSENCE'")
    Long countAbsencesByStudent(@Param("schoolId") Long schoolId, @Param("studentId") UUID studentId);

    // Compter les absences justifiées
    @Query("SELECT COUNT(h) FROM HistoriqueProfesseur h WHERE h.schoolId = :schoolId " +
           "AND h.studentId = :studentId AND h.eventType = 'ABSENCE' AND h.isJustified = true")
    Long countJustifiedAbsencesByStudent(@Param("schoolId") Long schoolId, @Param("studentId") UUID studentId);

    // Compter les absences non justifiées
    @Query("SELECT COUNT(h) FROM HistoriqueProfesseur h WHERE h.schoolId = :schoolId " +
           "AND h.studentId = :studentId AND h.eventType = 'ABSENCE' AND h.isJustified = false")
    Long countUnjustifiedAbsencesByStudent(@Param("schoolId") Long schoolId, @Param("studentId") UUID studentId);

    // Vérifier si une absence existe déjà pour un étudiant à une date donnée
    @Query("SELECT COUNT(h) > 0 FROM HistoriqueProfesseur h WHERE h.schoolId = :schoolId " +
           "AND h.studentId = :studentId AND h.eventDate = :eventDate AND h.eventType = 'ABSENCE'")
    boolean existsByStudentAndDate(
        @Param("schoolId") Long schoolId,
        @Param("studentId") UUID studentId,
        @Param("eventDate") LocalDate eventDate
    );

    // Trouver les absences par enseignant, classe et période
    @Query("SELECT h FROM HistoriqueProfesseur h WHERE h.schoolId = :schoolId " +
           "AND h.teacherId = :teacherId AND h.classId = :classId " +
           "AND h.eventDate BETWEEN :startDate AND :endDate ORDER BY h.eventDate DESC")
    List<HistoriqueProfesseur> findByTeacherClassAndDateRange(
        @Param("schoolId") Long schoolId,
        @Param("teacherId") UUID teacherId,
        @Param("classId") UUID classId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
