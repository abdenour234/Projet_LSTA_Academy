package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Activity;
import com.schoolmanagement.entity.Teacher;
import com.schoolmanagement.repository.ActivityRepository;
import com.schoolmanagement.repository.TeacherRepository;
import com.schoolmanagement.security.ResourceOwnershipValidator;
import com.schoolmanagement.security.ResourceOwnershipValidator.UserContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller for teacher-specific activity operations including approval workflow
 */
@RestController
@RequestMapping("/api/teacher/activities")
@CrossOrigin(origins = "*")
public class TeacherActivityController {
    
    private static final Logger log = LoggerFactory.getLogger(TeacherActivityController.class);
    
    private final ActivityRepository activityRepository;
    private final TeacherRepository teacherRepository;
    private final ResourceOwnershipValidator ownershipValidator;    public TeacherActivityController(
            ActivityRepository activityRepository,
            TeacherRepository teacherRepository,
            ResourceOwnershipValidator ownershipValidator) {
        this.activityRepository = activityRepository;
        this.teacherRepository = teacherRepository;
        this.ownershipValidator = ownershipValidator;
    }

    /**
     * Get pending activities for the current teacher's subjects/classes
     * Teacher sees activities where:
     * - Activity's subject matches teacher's specialty
     * - Activity status is PENDING
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<Activity>> getPendingActivities(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        // Find teacher by profile ID
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        log.info("=== TEACHER PENDING ACTIVITIES DEBUG ===");
        log.info("Teacher ID: {}", teacher.getId());
        log.info("Teacher Subject ID: {}", teacher.getSubjectId());
        log.info("Teacher School ID: {}", user.schoolId);
        
        // Get all pending activities for the school
        List<Activity> pendingActivities = activityRepository
                .findBySchoolIdAndApprovalStatus(Long.parseLong(user.schoolId), "PENDING");
        
        log.info("Total pending activities in school: {}", pendingActivities.size());
        pendingActivities.forEach(activity -> {
            log.info("  Activity ID: {}, Title: {}, SubjectId: {}, Status: {}",
                    activity.getId(), activity.getTitle(), activity.getSubjectId(), activity.getApprovalStatus());
        });
        
        // Filter by teacher's subject ID
        List<Activity> teacherPendingActivities = pendingActivities.stream()
                .filter(activity -> {
                    boolean matches = activity.getSubjectId() != null && 
                                    activity.getSubjectId().equals(teacher.getSubjectId());
                    log.info("  Activity {} subject match: {} (Activity: {} vs Teacher: {})",
                            activity.getId(), matches, activity.getSubjectId(), teacher.getSubjectId());
                    return matches;
                })
                .collect(Collectors.toList());
        
        log.info("Filtered activities for teacher: {}", teacherPendingActivities.size());
        log.info("=========================================");
        
        return ResponseEntity.ok(teacherPendingActivities);
    }

    /**
     * Get count of pending activities for notification badge
     */
    @GetMapping("/pending/count")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, Integer>> getPendingCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        // Find teacher by profile ID
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        // Get all pending activities for the school
        List<Activity> pendingActivities = activityRepository
                .findBySchoolIdAndApprovalStatus(Long.parseLong(user.schoolId), "PENDING");
        
        // Count activities matching teacher's subject
        long count = pendingActivities.stream()
                .filter(activity -> activity.getSubjectId() != null && 
                        activity.getSubjectId().equals(teacher.getSubjectId()))
                .count();
        
        return ResponseEntity.ok(Map.of("count", (int) count));
    }

    /**
     * Get all activities for the teacher's classes and subjects
     * Includes approved, pending, and denied activities
     */
    @GetMapping("/my-activities")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<Activity>> getMyActivities(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        // Find teacher by profile ID
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        // Get all activities for the school
        List<Activity> allActivities = activityRepository.findBySchoolId(Long.parseLong(user.schoolId));
        
        // Filter by teacher's subject ID
        List<Activity> teacherActivities = allActivities.stream()
                .filter(activity -> activity.getSubjectId() != null && 
                        activity.getSubjectId().equals(teacher.getSubjectId()))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(teacherActivities);
    }

    /**
     * Approve an activity
     * Sets status to APPROVED and records the approving teacher
     */
    @PostMapping("/{activityId}/approve")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> approveActivity(
            @PathVariable UUID activityId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        // Find teacher
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        // Find activity
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        // Verify activity belongs to teacher's school
        if (!activity.getSchoolId().equals(Long.parseLong(user.schoolId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cannot approve activity from another school"));
        }
        
        // Verify activity's subject matches teacher's specialty
        if (activity.getSubjectId() == null || 
            !activity.getSubjectId().equals(teacher.getSubjectId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only approve activities for your specialty"));
        }
        
        // Update approval status
        activity.setApprovalStatus("APPROVED");
        activity.setApprovedBy(user.userId);
        activity.setIsPublished(true); // Automatically publish when approved
        
        Activity saved = activityRepository.save(activity);
        
        return ResponseEntity.ok(Map.of(
                "message", "Activity approved successfully",
                "activity", saved
        ));
    }

    /**
     * Deny an activity
     * Sets status to DENIED and records the denying teacher
     */
    @PostMapping("/{activityId}/deny")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> denyActivity(
            @PathVariable UUID activityId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        // Find teacher
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        // Find activity
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        // Verify activity belongs to teacher's school
        if (!activity.getSchoolId().equals(Long.parseLong(user.schoolId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cannot deny activity from another school"));
        }
        
        // Verify activity's subject matches teacher's specialty
        if (activity.getSubjectId() == null || 
            !activity.getSubjectId().equals(teacher.getSubjectId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only deny activities for your specialty"));
        }
        
        // Update approval status
        activity.setApprovalStatus("DENIED");
        activity.setApprovedBy(user.userId);
        activity.setIsPublished(false);
        
        Activity saved = activityRepository.save(activity);
        
        return ResponseEntity.ok(Map.of(
                "message", "Activity denied",
                "activity", saved
        ));
    }
}
