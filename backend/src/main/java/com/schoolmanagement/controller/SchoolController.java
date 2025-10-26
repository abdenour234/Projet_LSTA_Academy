package com.schoolmanagement.controller;

import com.schoolmanagement.entity.School;
import com.schoolmanagement.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schools")
@CrossOrigin(origins = "*")
public class SchoolController {

    private final SchoolRepository schoolRepository;

    public SchoolController(SchoolRepository schoolRepository) {
        this.schoolRepository = schoolRepository;
    }

    // Public endpoint - anyone can view schools list
    @GetMapping
    public ResponseEntity<List<School>> getAllSchools() {
        return ResponseEntity.ok(schoolRepository.findAll());
    }

    // Public endpoint - anyone can view school details
    @GetMapping("/{id}")
    public ResponseEntity<School> getSchool(@PathVariable Long id) {
        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("School not found"));
        return ResponseEntity.ok(school);
    }

    // Public endpoint
    @GetMapping("/by-city/{city}")
    public ResponseEntity<List<School>> getSchoolsByCity(@PathVariable String city) {
        return ResponseEntity.ok(schoolRepository.findByCity(city));
    }

    // Public endpoint
    @GetMapping("/by-region/{region}")
    public ResponseEntity<List<School>> getSchoolsByRegion(@PathVariable String region) {
        return ResponseEntity.ok(schoolRepository.findByRegion(region));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<School> createSchool(@RequestBody School school) {
        // ID will be auto-generated, so we set it to null
        school.setId(null);
        School saved = schoolRepository.save(school);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<School> updateSchool(@PathVariable Long id, @RequestBody School school) {
        if (!schoolRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        school.setId(id);
        School updated = schoolRepository.save(school);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchool(@PathVariable Long id) {
        if (!schoolRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        schoolRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
