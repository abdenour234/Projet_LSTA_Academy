package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {
    List<Student> findBySchoolId(Long schoolId);

    List<Student> findByClassId(UUID classId);

    List<Student> findBySchoolIdAndClassId(Long schoolId, UUID classId);

    List<Student> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);

    Optional<Student> findByUserId(UUID userId);  // Doit retourner Optional<Student>};
}
