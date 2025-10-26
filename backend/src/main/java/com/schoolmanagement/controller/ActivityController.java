package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Activity;
import com.schoolmanagement.repository.ActivityRepository;
import com.schoolmanagement.security.ResourceOwnershipValidator;
import com.schoolmanagement.security.ResourceOwnershipValidator.UserContext;
import com.schoolmanagement.util.InputSanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "*")
public class ActivityController {

    private final ActivityRepository activityRepository;
    private final ResourceOwnershipValidator ownershipValidator;
    private final InputSanitizer inputSanitizer;

    public ActivityController(ActivityRepository activityRepository,
                            ResourceOwnershipValidator ownershipValidator,
                            InputSanitizer inputSanitizer) {
        this.activityRepository = activityRepository;
        this.ownershipValidator = ownershipValidator;
        this.inputSanitizer = inputSanitizer;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Activity>> getAllActivities() {
        return ResponseEntity.ok(activityRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Activity> getActivity(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        // Ownership validation
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        if (!ownershipValidator.canAccessActivity(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(activity);
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Activity>> getActivitiesBySchool(@PathVariable String schoolId) {
        return ResponseEntity.ok(activityRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Activity>> getActivitiesByType(@PathVariable String type) {
        return ResponseEntity.ok(activityRepository.findByType(type));
    }

    // UPDATED: Accept optional classId for filtering
    @GetMapping("/published")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Activity>> getPublishedActivities(
            @RequestParam String schoolId,
            @RequestParam(required = false) UUID classId) {
        if (classId != null) {
            return ResponseEntity.ok(activityRepository.findBySchoolIdAndClassIdAndIsPublished(schoolId, classId, true));
        } else {
            return ResponseEntity.ok(activityRepository.findBySchoolIdAndIsPublished(schoolId, true));
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Activity> createActivity(
            @RequestBody Activity activity,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Sanitize text inputs
        if (activity.getTitle() != null) {
            activity.setTitle(inputSanitizer.sanitizeText(activity.getTitle()));
        }
        if (activity.getDescription() != null) {
            activity.setDescription(inputSanitizer.sanitizeForHtml(activity.getDescription()));
        }
        
        // Ownership validation - ensure user can create in this school
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        if (!ownershipValidator.belongsToSchool(user, activity.getSchoolId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Activity saved = activityRepository.save(activity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Activity> updateActivity(
            @PathVariable UUID id, 
            @RequestBody Activity activity,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!activityRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Ownership validation
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        if (!ownershipValidator.canModifyActivity(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // Sanitize text inputs
        if (activity.getTitle() != null) {
            activity.setTitle(inputSanitizer.sanitizeText(activity.getTitle()));
        }
        if (activity.getDescription() != null) {
            activity.setDescription(inputSanitizer.sanitizeForHtml(activity.getDescription()));
        }
        
        activity.setId(id);
        Activity updated = activityRepository.save(activity);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!activityRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Ownership validation
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        if (!ownershipValidator.canModifyActivity(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        activityRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}