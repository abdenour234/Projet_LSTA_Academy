package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Student;
import com.schoolmanagement.repository.StudentRepository;
import com.schoolmanagement.util.JwtUtil;  // Assume you have JwtUtil for extracting userId
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentRepository studentRepository;
    private final JwtUtil jwtUtil;  // NEW: For extracting userId from token

    public StudentController(StudentRepository studentRepository, JwtUtil jwtUtil) {
        this.studentRepository = studentRepository;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudent(@PathVariable UUID id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return ResponseEntity.ok(student);
    }

    @GetMapping("/school/{schoolId}")
    public ResponseEntity<List<Student>> getStudentsBySchool(@PathVariable String schoolId) {
        return ResponseEntity.ok(studentRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/class/{classId}")
    public ResponseEntity<List<Student>> getStudentsByClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(studentRepository.findByClassId(classId));
    }

    // NEW: Get current student (/me)
    @GetMapping("/me")
    public ResponseEntity<Student> getCurrentStudent(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            UUID userId = UUID.fromString(jwtUtil.extractUserId(token));  // Extract userId from JWT
            Student student = studentRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));  // Correct: Call orElseThrow on Optional
            return ResponseEntity.ok(student);
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch current student: " + e.getMessage(), e);
        }
    }

    @PostMapping
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        // NEW: Set userId if provided in body (from frontend register)
        Student saved = studentRepository.save(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable UUID id, @RequestBody Student student) {
        if (!studentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        student.setId(id);
        Student updated = studentRepository.save(student);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable UUID id) {
        if (!studentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        studentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}