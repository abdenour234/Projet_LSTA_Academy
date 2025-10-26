package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Activity;
import com.schoolmanagement.repository.ActivityRepository;
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

    public ActivityController(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Activity>> getAllActivities() {
        return ResponseEntity.ok(activityRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Activity> getActivity(@PathVariable UUID id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
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
    public ResponseEntity<Activity> createActivity(@RequestBody Activity activity) {
        // NEW: Validate classId if provided (optional logic)
        Activity saved = activityRepository.save(activity);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Activity> updateActivity(@PathVariable UUID id, @RequestBody Activity activity) {
        if (!activityRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        activity.setId(id);
        Activity updated = activityRepository.save(activity);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteActivity(@PathVariable UUID id) {
        if (!activityRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        activityRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}