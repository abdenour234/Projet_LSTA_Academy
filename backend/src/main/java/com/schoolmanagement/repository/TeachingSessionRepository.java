package com.schoolmanagement.repository;

import com.schoolmanagement.entity.TeachingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeachingSessionRepository extends JpaRepository<TeachingSession, UUID> {
    List<TeachingSession> findBySchoolId(Long schoolId);
    List<TeachingSession> findByTeacherId(UUID teacherId);
    List<TeachingSession> findByClassId(UUID classId);
    List<TeachingSession> findByActivityId(UUID activityId);
    List<TeachingSession> findBySchoolIdAndTeacherId(Long schoolId, UUID teacherId);
    List<TeachingSession> findByTeacherIdAndClassId(UUID teacherId, UUID classId);
}
