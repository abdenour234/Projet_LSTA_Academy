package com.schoolmanagement.repository;

import com.schoolmanagement.entity.DiagnosticSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DiagnosticSessionRepository extends JpaRepository<DiagnosticSession, UUID> {
    List<DiagnosticSession> findBySchoolIdOrderByCreatedAtDesc(Long schoolId);
    List<DiagnosticSession> findByTeacherIdOrderByCreatedAtDesc(UUID teacherId);
    List<DiagnosticSession> findBySchoolIdAndTeacherIdOrderByCreatedAtDesc(Long schoolId, UUID teacherId);
}