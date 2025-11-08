package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Resource;
import com.schoolmanagement.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
public class ResourceController {

    private final ResourceRepository resourceRepository;

    public ResourceController(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() {
        return ResponseEntity.ok(resourceRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> getResource(@PathVariable UUID id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        return ResponseEntity.ok(resource);
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Resource>> getResourcesBySchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok(resourceRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Resource>> getResourcesByType(@PathVariable String type) {
        return ResponseEntity.ok(resourceRepository.findByType(type));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        Resource saved = resourceRepository.save(resource);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Resource> updateResource(@PathVariable UUID id, @RequestBody Resource resource) {
        if (!resourceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        resource.setId(id);
        Resource updated = resourceRepository.save(resource);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID id) {
        if (!resourceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        resourceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
