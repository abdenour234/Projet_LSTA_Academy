package com.schoolmanagement.service;

import com.schoolmanagement.dto.ActivityCreationDTO;
import com.schoolmanagement.entity.Activity;
import com.schoolmanagement.model.ActivityAssignment;
import com.schoolmanagement.entity.School;
import com.schoolmanagement.repository.ActivityRepository;
import com.schoolmanagement.repository.ActivityAssignmentRepository;
import com.schoolmanagement.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SuperAdminActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityAssignmentRepository activityAssignmentRepository;
    private final SchoolRepository schoolRepository;

    @Transactional
    public Activity createAndDistributeActivity(ActivityCreationDTO dto) {
        // Create the activity (will be distributed to all selected schools)
        Activity activity = new Activity();
        activity.setTitle(dto.getTitle());
        activity.setDescription(dto.getDescription());
        activity.setType(dto.getType());
        activity.setLevel(dto.getDifficulty()); // map difficulty to level
        activity.setSchoolId("superadmin"); // special marker for super admin activities
        activity.setIsPublished(true);
        activity.setCreatedBy(null); // superadmin UUID if available
        activity.setCreatedAt(LocalDateTime.now());
        activity.setUpdatedAt(LocalDateTime.now());
        
        Activity savedActivity = activityRepository.save(activity);

        // Create assignments for each selected school
        List<ActivityAssignment> assignments = dto.getSchoolIds().stream()
            .map(schoolId -> {
                School school = schoolRepository.findById(schoolId)
                    .orElseThrow(() -> new RuntimeException("School not found: " + schoolId));
                
                ActivityAssignment assignment = new ActivityAssignment();
                assignment.setActivity(savedActivity);
                assignment.setSchool(school);
                assignment.setAssignedAt(LocalDateTime.now());
                assignment.setAssignedBy("superadmin");
                return assignment;
            })
            .collect(Collectors.toList());

        activityAssignmentRepository.saveAll(assignments);

        return savedActivity;
    }

    public List<Activity> getAllActivities() {
        return activityRepository.findAll();
    }

    public Activity getActivityById(UUID id) {
        return activityRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Activity not found: " + id));
    }

    @Transactional
    public void deleteActivity(UUID id) {
        // Delete assignments first due to foreign key constraint
        activityAssignmentRepository.deleteByActivityId(id);
        activityRepository.deleteById(id);
    }

    public List<Activity> getActivitiesBySchool(Long schoolId) {
        List<ActivityAssignment> assignments = activityAssignmentRepository.findBySchoolId(schoolId);
        return assignments.stream()
            .map(ActivityAssignment::getActivity)
            .collect(Collectors.toList());
    }
}
