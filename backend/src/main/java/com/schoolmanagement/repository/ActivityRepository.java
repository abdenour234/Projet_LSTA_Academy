package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findBySchoolId(String schoolId);
    List<Activity> findByType(String type);
    List<Activity> findByLevel(String level);
    List<Activity> findBySchoolIdAndType(String schoolId, String type);
    List<Activity> findBySchoolIdAndLevel(String schoolId, String level);
    List<Activity> findByCreatedBy(UUID createdBy);
    List<Activity> findByIsPublished(Boolean isPublished);
    List<Activity> findBySchoolIdAndIsPublished(String schoolId, Boolean isPublished);
    List<Activity> findBySchoolIdAndClassIdAndIsPublished(String schoolId, UUID classId, boolean isPublished);
}
