package com.schoolmanagement.controller;

import com.schoolmanagement.dto.ActivityCreationDTO;
import com.schoolmanagement.entity.Activity;
import com.schoolmanagement.service.SuperAdminActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/superadmin/activities")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPERADMIN')")
public class SuperAdminActivityController {

    private final SuperAdminActivityService activityService;

    @PostMapping
    public ResponseEntity<Activity> createActivity(@RequestBody ActivityCreationDTO activityDTO) {
        Activity activity = activityService.createAndDistributeActivity(activityDTO);
        return ResponseEntity.ok(activity);
    }

    @GetMapping
    public ResponseEntity<List<Activity>> getAllActivities() {
        List<Activity> activities = activityService.getAllActivities();
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Activity> getActivity(@PathVariable UUID id) {
        Activity activity = activityService.getActivityById(id);
        return ResponseEntity.ok(activity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable UUID id) {
        activityService.deleteActivity(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<Activity>> getActivitiesBySchool(@PathVariable Long schoolId) {
        List<Activity> activities = activityService.getActivitiesBySchool(schoolId);
        return ResponseEntity.ok(activities);
    }
}
