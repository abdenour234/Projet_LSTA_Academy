package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Classe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClasseRepository extends JpaRepository<Classe, UUID> {
    
    List<Classe> findBySchoolId(Long schoolId);
    
    List<Classe> findBySchoolIdAndLevel(Long schoolId, String level);
    
    List<Classe> findBySchoolIdAndAcademicYear(Long schoolId, String academicYear);
}
