package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Classe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClasseRepository extends JpaRepository<Classe, UUID> {
    
    List<Classe> findBySchoolId(String schoolId);
    
    List<Classe> findBySchoolIdAndLevel(String schoolId, String level);
    
    List<Classe> findBySchoolIdAndAcademicYear(String schoolId, String academicYear);
}
