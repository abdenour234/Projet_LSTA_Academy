package com.schoolmanagement.repository;

import com.schoolmanagement.entity.TeachingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeachingSessionRepository extends JpaRepository<TeachingSession, UUID> {
    List<TeachingSession> findByTeacherId(UUID teacherId);
    List<TeachingSession> findBySchoolId(String schoolId);
    List<TeachingSession> findByClassId(UUID classId);
}
