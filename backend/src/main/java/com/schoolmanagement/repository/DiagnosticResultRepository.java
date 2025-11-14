package com.schoolmanagement.repository;

import com.schoolmanagement.entity.DiagnosticResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DiagnosticResultRepository extends JpaRepository<DiagnosticResult, UUID> {
    List<DiagnosticResult> findBySessionId(UUID sessionId);
    void deleteBySessionId(UUID sessionId);
    boolean existsBySessionId(UUID sessionId);
}