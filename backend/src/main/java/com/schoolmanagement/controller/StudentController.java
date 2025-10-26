package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Student;
import com.schoolmanagement.repository.StudentRepository;
import com.schoolmanagement.util.JwtUtil;  // Assume you have JwtUtil for extracting userId
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<Student> getStudent(@PathVariable UUID id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        return ResponseEntity.ok(student);
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Student>> getStudentsBySchool(@PathVariable String schoolId) {
        return ResponseEntity.ok(studentRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/class/{classId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Student>> getStudentsByClass(@PathVariable UUID classId) {
        return ResponseEntity.ok(studentRepository.findByClassId(classId));
    }

    // NEW: Get current student (/me)
    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Student> getCurrentStudent(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            UUID userId = UUID.fromString(jwtUtil.extractUserId(token));  // Extract userId from JWT
            Student student = studentRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));  // Correct: Call orElseThrow on Optional
            return ResponseEntity.ok(student);
        } catch (RuntimeException e) {
            // If student not found, return 404 instead of 500
            if (e.getMessage().contains("Student not found")) {
                return ResponseEntity.notFound().build();
            }
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch current student: " + e.getMessage(), e);
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
        // NEW: Set userId if provided in body (from frontend register)
        Student saved = studentRepository.save(student);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Student> updateStudent(@PathVariable UUID id, @RequestBody Student student) {
        if (!studentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        student.setId(id);
        Student updated = studentRepository.save(student);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteStudent(@PathVariable UUID id) {
        if (!studentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        studentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}