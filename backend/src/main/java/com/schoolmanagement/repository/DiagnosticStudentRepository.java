package com.schoolmanagement.repository;

import com.schoolmanagement.entity.DiagnosticStudent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DiagnosticStudentRepository extends JpaRepository<DiagnosticStudent, UUID> {
    List<DiagnosticStudent> findBySessionIdOrderByStudentOrder(UUID sessionId);
    void deleteBySessionId(UUID sessionId);
}