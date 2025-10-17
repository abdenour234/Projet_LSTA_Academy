package com.schoolmanagement.controller;

import com.schoolmanagement.entity.School;
import com.schoolmanagement.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping
    public ResponseEntity<List<School>> getAllSchools() {
        return ResponseEntity.ok(schoolRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<School> getSchool(@PathVariable String id) {
        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("School not found"));
        return ResponseEntity.ok(school);
    }

    @GetMapping("/by-city/{city}")
    public ResponseEntity<List<School>> getSchoolsByCity(@PathVariable String city) {
        return ResponseEntity.ok(schoolRepository.findByCity(city));
    }

    @GetMapping("/by-region/{region}")
    public ResponseEntity<List<School>> getSchoolsByRegion(@PathVariable String region) {
        return ResponseEntity.ok(schoolRepository.findByRegion(region));
    }

    @PostMapping
    public ResponseEntity<School> createSchool(@RequestBody School school) {
        School saved = schoolRepository.save(school);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<School> updateSchool(@PathVariable String id, @RequestBody School school) {
        if (!schoolRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        school.setId(id);
        School updated = schoolRepository.save(school);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchool(@PathVariable String id) {
        if (!schoolRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        schoolRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
