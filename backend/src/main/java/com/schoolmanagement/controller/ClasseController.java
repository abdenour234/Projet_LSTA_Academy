
package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.repository.ClasseRepository;
import com.schoolmanagement.service.OwnershipValidationService;
import com.schoolmanagement.service.ClasseService;
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

    private final ClasseService classeService;
    private final OwnershipValidationService ownershipValidator;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Classe>> getAllClasses() {
        return ResponseEntity.ok(classeService.getAllClasses());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Classe> getClasse(
            @PathVariable UUID id,
            Authentication authentication) {
        
        Classe classe = classeService.getClasseById(id);
        
        // ✅ Valider l'accès à cette école
        ownershipValidator.validateSchoolAccess(classe.getSchoolId(), authentication);
        
        return ResponseEntity.ok(classe);
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Classe>> getClassesBySchool(
            @PathVariable Long schoolId,
            Authentication authentication) {
        
        // ✅ Valider l'accès à cette école
        ownershipValidator.validateSchoolAccess(schoolId, authentication);
        
        // ✅ Utiliser le service pour récupérer les classes
        return ResponseEntity.ok(classeService.getClassesBySchool(schoolId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Classe> createClasse(
            @RequestBody Classe classe,
            Authentication authentication) {
        
        // ✅ Valider l'accès à cette école
        ownershipValidator.validateSchoolAccess(classe.getSchoolId(), authentication);
        
        // ✅ Utiliser le service pour créer la classe
        Classe saved = classeService.createClasse(classe);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Classe> updateClasse(
            @PathVariable UUID id,
            @RequestBody Classe classe,
            Authentication authentication) {
        
        // ✅ Récupérer la classe existante pour valider
        Classe existing = classeService.getClasseById(id);
        
        // ✅ Valider l'accès à cette école
        ownershipValidator.validateSchoolAccess(existing.getSchoolId(), authentication);
        
        // ✅ Utiliser le service pour mettre à jour la classe
        Classe updated = classeService.updateClasse(id, classe);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteClasse(
            @PathVariable UUID id, 
            Authentication authentication) {
        
        // ✅ Récupérer la classe existante pour valider
        Classe classe = classeService.getClasseById(id);
        
        // ✅ Valider l'accès à cette école
        ownershipValidator.validateSchoolAccess(classe.getSchoolId(), authentication);
        
        // ✅ Utiliser le service qui gère la suppression en cascade
        classeService.deleteClasse(id);
        return ResponseEntity.noContent().build();
    }
}











