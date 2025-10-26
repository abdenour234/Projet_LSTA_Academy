package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.repository.ClasseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClasseController {

    private final ClasseRepository classeRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Classe>> getAllClasses() {
        return ResponseEntity.ok(classeRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Classe> getClasse(@PathVariable UUID id) {
        Classe classe = classeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        return ResponseEntity.ok(classe);
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Classe>> getClassesBySchool(@PathVariable String schoolId) {
        return ResponseEntity.ok(classeRepository.findBySchoolId(schoolId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Classe> createClasse(@RequestBody Classe classe) {
        classe.setId(UUID.randomUUID());
        Classe saved = classeRepository.save(classe);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Classe> updateClasse(@PathVariable UUID id, @RequestBody Classe classe) {
        if (!classeRepository.existsById(id)) {
            throw new RuntimeException("Class not found");
        }
        classe.setId(id);
        Classe updated = classeRepository.save(classe);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteClasse(@PathVariable UUID id) {
        if (!classeRepository.existsById(id)) {
            throw new RuntimeException("Class not found");
        }
        classeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
