package com.schoolmanagement.service;

import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.repository.ClasseRepository;
import com.schoolmanagement.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClasseService {

    private final ClasseRepository classeRepository;
    private final StudentRepository studentRepository;

    // ...existing code...

    /**
     * Get all classes
     */
    @Transactional(readOnly = true)
    public List<Classe> getAllClasses() {
        List<Classe> classes = classeRepository.findAll();
        
        // ✅ Calculer l'effectif réel pour chaque classe
        classes.forEach(classe -> {
            Integer actualCount = studentRepository.countByClassId(classe.getId());
            classe.setStudentCount(actualCount != null ? actualCount : 0);
        });
        
        return classes;
    }

    /**
     * Get a specific class by ID with correct student count
     */
    @Transactional(readOnly = true)
    public Classe getClasseById(UUID id) {
        Classe classe = classeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Classe not found with id: " + id));
        
        // ✅ Calculer l'effectif réel
        Integer actualCount = studentRepository.countByClassId(id);
        classe.setStudentCount(actualCount != null ? actualCount : 0);
        
        return classe;
    }

    /**
     * Get all classes for a school with correct student count
     */
    @Transactional(readOnly = true)
    public List<Classe> getClassesBySchool(Long schoolId) {
        List<Classe> classes = classeRepository.findBySchoolId(schoolId);
        
        // ✅ Calculer l'effectif réel depuis la BD
        classes.forEach(classe -> {
            Integer actualCount = studentRepository.countByClassId(classe.getId());
            classe.setStudentCount(actualCount != null ? actualCount : 0);
        });
        
        return classes;
    }

    /**
     * Create a new class
     */
    @Transactional
    public Classe createClasse(Classe classe) {
        // ✅ Initialiser studentCount à 0
        if (classe.getStudentCount() == null) {
            classe.setStudentCount(0);
        }
        log.info("Creating class: {}", classe.getName());
        return classeRepository.save(classe);
    }

    /**
     * Update an existing class
     */
    @Transactional
    public Classe updateClasse(UUID id, Classe classe) {
        Classe existing = classeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Classe not found with id: " + id));
        
        existing.setName(classe.getName());
        existing.setLevel(classe.getLevel());
        existing.setFiliere(classe.getFiliere());
        existing.setAcademicYear(classe.getAcademicYear());
        
        // ✅ Recalculer l'effectif réel
        Integer actualCount = studentRepository.countByClassId(id);
        existing.setStudentCount(actualCount != null ? actualCount : 0);
        
        log.info("Updating class: {}", id);
        return classeRepository.save(existing);
    }

    /**
     * Delete a class and all its students (cascade)
     */
    @Transactional
    public void deleteClasse(UUID id) {
        Classe classe = classeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Classe not found with id: " + id));
        
        // ✅ Supprimer tous les étudiants de cette classe en cascade
        studentRepository.deleteByClassId(id);
        
        // ✅ Supprimer la classe
        classeRepository.deleteById(id);
        
        log.info("Deleted class: {} with all its students", id);
    }
}