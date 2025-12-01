package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Classe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClasseRepository extends JpaRepository<Classe, UUID> {
    
    List<Classe> findBySchoolId(Long schoolId);
    
    List<Classe> findBySchoolIdAndLevel(Long schoolId, String level);
    
    List<Classe> findBySchoolIdAndAcademicYear(Long schoolId, String academicYear);
    
    /**
     * Récupérer les classes d'un enseignant via la table class_subjects
     * Utilise une requête SQL native car il n'y a pas de relation JPA directe
     */
    @Query(value = "SELECT DISTINCT c.* FROM classes c " +
           "INNER JOIN class_subjects cs ON c.id = cs.class_id " +
           "WHERE c.school_id = :schoolId AND cs.teacher_id = :teacherId", 
           nativeQuery = true)
    List<Classe> findBySchoolIdAndTeacherId(@Param("schoolId") Long schoolId, @Param("teacherId") UUID teacherId);
}
