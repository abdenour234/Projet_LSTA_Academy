package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Student;
import com.schoolmanagement.repository.StudentRepository;
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

    public StudentController(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
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

    @PostMapping
    public ResponseEntity<Student> createStudent(@RequestBody Student student) {
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
