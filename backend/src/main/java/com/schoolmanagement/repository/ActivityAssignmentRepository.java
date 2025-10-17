package com.schoolmanagement.repository;

import com.schoolmanagement.model.ActivityAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityAssignmentRepository extends JpaRepository<ActivityAssignment, UUID> {
    List<ActivityAssignment> findBySchoolId(Long schoolId);
    List<ActivityAssignment> findByActivityId(UUID activityId);
    void deleteByActivityId(UUID activityId);
}
