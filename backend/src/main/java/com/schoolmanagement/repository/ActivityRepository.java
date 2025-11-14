package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findBySchoolId(Long schoolId);
    List<Activity> findByType(String type);
    List<Activity> findByLevel(String level);
    List<Activity> findBySchoolIdAndType(Long schoolId, String type);
    List<Activity> findBySchoolIdAndLevel(Long schoolId, String level);
    List<Activity> findByCreatedBy(UUID createdBy);
    List<Activity> findByIsPublished(Boolean isPublished);
    List<Activity> findBySchoolIdAndIsPublished(Long schoolId, Boolean isPublished);
    List<Activity> findBySchoolIdAndClassIdAndIsPublished(Long schoolId, UUID classId, boolean isPublished);
    
    // Approval-related queries
    List<Activity> findByApprovalStatus(String approvalStatus);
    List<Activity> findBySchoolIdAndApprovalStatus(Long schoolId, String approvalStatus);
    List<Activity> findBySubjectIdAndApprovalStatus(UUID subjectId, String approvalStatus);
    List<Activity> findByClassIdAndApprovalStatus(UUID classId, String approvalStatus);
}
