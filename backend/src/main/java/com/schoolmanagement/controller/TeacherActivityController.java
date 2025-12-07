package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Activity;
import com.schoolmanagement.entity.ClassSubject;
import com.schoolmanagement.entity.Teacher;
import com.schoolmanagement.repository.ActivityRepository;
import com.schoolmanagement.repository.ClassSubjectRepository;
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
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/teacher/activities")
@CrossOrigin(origins = "*")
public class TeacherActivityController {
    
    private static final Logger log = LoggerFactory.getLogger(TeacherActivityController.class);
    
    private final ActivityRepository activityRepository;
    private final TeacherRepository teacherRepository;
    private final ClassSubjectRepository classSubjectRepository;
    private final ResourceOwnershipValidator ownershipValidator;

    public TeacherActivityController(
            ActivityRepository activityRepository,
            TeacherRepository teacherRepository,
            ClassSubjectRepository classSubjectRepository,
            ResourceOwnershipValidator ownershipValidator) {
        this.activityRepository = activityRepository;
        this.teacherRepository = teacherRepository;
        this.classSubjectRepository = classSubjectRepository;
        this.ownershipValidator = ownershipValidator;
    }

    /**
     * Get teacher's assigned class IDs as Longs
     * Converts UUID from ClassSubject to Long for Activity comparison
     */
    private Set<Long> getTeacherClassIdsAsLong(UUID teacherId) {
        List<ClassSubject> assignments = classSubjectRepository.findByTeacherId(teacherId);
        return assignments.stream()
                .map(cs -> {
                    UUID classUuid = cs.getClassId();
                    // Convert UUID to Long by taking the least significant bits
                    // This is a workaround - ideally you should use consistent types
                    return classUuid.getLeastSignificantBits() & Long.MAX_VALUE;
                })
                .collect(Collectors.toSet());
    }

    /**
     * Get teacher's assigned class IDs as UUIDs
     */
    private Set<UUID> getTeacherClassIds(UUID teacherId) {
        List<ClassSubject> assignments = classSubjectRepository.findByTeacherId(teacherId);
        return assignments.stream()
                .map(ClassSubject::getClassId)
                .collect(Collectors.toSet());
    }

    /**
     * Check if activity's class is assigned to teacher
     * Handles both Long and UUID comparison
     */
    private boolean isActivityClassAssignedToTeacher(Activity activity, Set<UUID> teacherClassIds) {
        if (activity.getClassId() == null) {
            return false;
        }
        
        // Activity.classId is Long, we need to check against UUID classIds
        // We'll convert teacher's UUID class IDs to Long for comparison
        Long activityClassId = activity.getClassId();
        
        for (UUID teacherClassUuid : teacherClassIds) {
            // Simple comparison: convert UUID's least significant bits to Long
            Long teacherClassAsLong = teacherClassUuid.getLeastSignificantBits() & Long.MAX_VALUE;
            if (activityClassId.equals(teacherClassAsLong)) {
                return true;
            }
        }
        
        return false;
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<Activity>> getPendingActivities(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Set<UUID> teacherClassIds = getTeacherClassIds(teacher.getId());
        
        log.info("=== TEACHER PENDING ACTIVITIES ===");
        log.info("Teacher: {}, Subject: {}, Classes: {}", teacher.getId(), teacher.getSubjectId(), teacherClassIds);
        
        List<Activity> pendingActivities = activityRepository
                .findBySchoolIdAndApprovalStatus(Long.parseLong(user.schoolId), "PENDING");
        
        List<Activity> filtered = pendingActivities.stream()
                .filter(activity -> 
                    activity.getSubjectId() != null && 
                    activity.getSubjectId().equals(teacher.getSubjectId()) &&
                    isActivityClassAssignedToTeacher(activity, teacherClassIds)
                )
                .collect(Collectors.toList());
        
        log.info("Filtered: {} / {}", filtered.size(), pendingActivities.size());
        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/pending/count")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Map<String, Integer>> getPendingCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Set<UUID> teacherClassIds = getTeacherClassIds(teacher.getId());
        
        List<Activity> pendingActivities = activityRepository
                .findBySchoolIdAndApprovalStatus(Long.parseLong(user.schoolId), "PENDING");
        
        long count = pendingActivities.stream()
                .filter(activity -> 
                    activity.getSubjectId() != null && 
                    activity.getSubjectId().equals(teacher.getSubjectId()) &&
                    isActivityClassAssignedToTeacher(activity, teacherClassIds)
                )
                .count();
        
        return ResponseEntity.ok(Map.of("count", (int) count));
    }

    @GetMapping("/my-activities")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<Activity>> getMyActivities(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Set<UUID> teacherClassIds = getTeacherClassIds(teacher.getId());
        
        log.info("=== TEACHER MY ACTIVITIES ===");
        log.info("Teacher: {}, Subject: {}, Classes: {}", teacher.getId(), teacher.getSubjectId(), teacherClassIds);
        
        List<Activity> allActivities = activityRepository.findBySchoolId(Long.parseLong(user.schoolId));
        
        List<Activity> filtered = allActivities.stream()
                .filter(activity -> 
                    activity.getSubjectId() != null && 
                    activity.getSubjectId().equals(teacher.getSubjectId()) &&
                    isActivityClassAssignedToTeacher(activity, teacherClassIds)
                )
                .collect(Collectors.toList());
        
        log.info("Filtered: {} / {}", filtered.size(), allActivities.size());
        return ResponseEntity.ok(filtered);
    }

    @PostMapping("/{activityId}/approve")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> approveActivity(
            @PathVariable UUID activityId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Set<UUID> teacherClassIds = getTeacherClassIds(teacher.getId());
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        if (!activity.getSchoolId().equals(Long.parseLong(user.schoolId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cannot approve activity from another school"));
        }
        
        if (activity.getSubjectId() == null || !activity.getSubjectId().equals(teacher.getSubjectId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only approve activities for your specialty"));
        }
        
        if (!isActivityClassAssignedToTeacher(activity, teacherClassIds)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only approve activities for your assigned classes"));
        }
        
        activity.setApprovalStatus("APPROVED");
        activity.setApprovedBy(user.userId);
        activity.setIsPublished(true);
        
        Activity saved = activityRepository.save(activity);
        return ResponseEntity.ok(Map.of("message", "Activity approved successfully", "activity", saved));
    }

    @PostMapping("/{activityId}/deny")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> denyActivity(
            @PathVariable UUID activityId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        Teacher teacher = teacherRepository.findByProfileId(user.userId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Set<UUID> teacherClassIds = getTeacherClassIds(teacher.getId());
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        if (!activity.getSchoolId().equals(Long.parseLong(user.schoolId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Cannot deny activity from another school"));
        }
        
        if (activity.getSubjectId() == null || !activity.getSubjectId().equals(teacher.getSubjectId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only deny activities for your specialty"));
        }
        
        if (!isActivityClassAssignedToTeacher(activity, teacherClassIds)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "You can only deny activities for your assigned classes"));
        }
        
        activity.setApprovalStatus("DENIED");
        activity.setApprovedBy(user.userId);
        activity.setIsPublished(false);
        
        Activity saved = activityRepository.save(activity);
        return ResponseEntity.ok(Map.of("message", "Activity denied", "activity", saved));
    }
}