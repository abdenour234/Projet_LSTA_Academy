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
    List<UserActivityLog> findBySchoolId(Long schoolId);
    List<UserActivityLog> findByActivityDate(LocalDate activityDate);
    List<UserActivityLog> findByActivityDateAfter(LocalDate startDate);
    List<UserActivityLog> findBySchoolIdAndActivityDateAfter(Long schoolId, LocalDate startDate);
    Long countBySchoolIdAndActivityDateAfter(Long schoolId, LocalDate startDate);
}
