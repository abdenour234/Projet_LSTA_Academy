package com.schoolmanagement.repository;

import com.schoolmanagement.entity.UserActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, UUID> {
    List<UserActivityLog> findByUserId(UUID userId);
    List<UserActivityLog> findBySchoolId(String schoolId);
    List<UserActivityLog> findByActivityDate(LocalDate activityDate);
    List<UserActivityLog> findByActivityDateAfter(LocalDate startDate);
    List<UserActivityLog> findBySchoolIdAndActivityDateAfter(String schoolId, LocalDate startDate);
    Long countBySchoolIdAndActivityDateAfter(String schoolId, LocalDate startDate);
}
