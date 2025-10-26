package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.repository.ClasseRepository;
import com.schoolmanagement.service.OwnershipValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClasseController {

    private final ClasseRepository classeRepository;
    private final OwnershipValidationService ownershipValidator;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Classe>> getAllClasses() {
        return ResponseEntity.ok(classeRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Classe> getClasse(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Classe classe = classeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        
        // Validate user can access this class's school
        ownershipValidator.validateSchoolAccess(classe.getSchoolId(), authentication);
        
        return ResponseEntity.ok(classe);
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Classe>> getClassesBySchool(
            @PathVariable String schoolId,
            Authentication authentication) {
        
        // Validate user can access this school
        ownershipValidator.validateSchoolAccess(schoolId, authentication);
        
        return ResponseEntity.ok(classeRepository.findBySchoolId(schoolId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Classe> createClasse(
            @RequestBody Classe classe,
            Authentication authentication) {
        
        // Validate user can create classes in this school
        ownershipValidator.validateSchoolAccess(classe.getSchoolId(), authentication);
        
        classe.setId(UUID.randomUUID());
        Classe saved = classeRepository.save(classe);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Classe> updateClasse(
            @PathVariable UUID id,
            @RequestBody Classe classe,
            Authentication authentication) {
        
        if (!classeRepository.existsById(id)) {
            throw new RuntimeException("Class not found");
        }
        
        // Validate user can update classes in this school
        ownershipValidator.validateSchoolAccess(classe.getSchoolId(), authentication);
        
        classe.setId(id);
        Classe updated = classeRepository.save(classe);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteClasse(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Classe classe = classeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class not found"));
        
        // Validate user can delete classes in this school
        ownershipValidator.validateSchoolAccess(classe.getSchoolId(), authentication);
        
        classeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
