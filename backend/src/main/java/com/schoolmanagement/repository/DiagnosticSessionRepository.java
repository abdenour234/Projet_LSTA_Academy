package com.schoolmanagement.repository;

import com.schoolmanagement.entity.DiagnosticSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DiagnosticSessionRepository extends JpaRepository<DiagnosticSession, UUID> {
    List<DiagnosticSession> findBySchoolId(String schoolId);
    List<DiagnosticSession> findByTeacherId(UUID teacherId);
    List<DiagnosticSession> findByClassId(UUID classId);
    List<DiagnosticSession> findBySchoolIdAndTeacherId(String schoolId, UUID teacherId);
    List<DiagnosticSession> findBySubject(String subject);
    List<DiagnosticSession> findByLevel(String level);
    List<DiagnosticSession> findByGridType(String gridType);
}
