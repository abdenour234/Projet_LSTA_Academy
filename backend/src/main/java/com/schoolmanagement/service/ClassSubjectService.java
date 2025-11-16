package com.schoolmanagement.service;

import com.schoolmanagement.dto.ClassSubjectDTO;
import com.schoolmanagement.entity.ClassSubject;
import com.schoolmanagement.repository.ClasseRepository;
import com.schoolmanagement.repository.ClassSubjectRepository;
import com.schoolmanagement.repository.SubjectRepository;
import com.schoolmanagement.repository.TeacherRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * ClassSubjectService
 * Service layer for managing class-subject-teacher assignments.
 * 
 * Sprint 1 - Ticket 7: Service for class-subject-teacher mapping
 * Handles business logic for:
 * - Assigning subjects to classes
 * - Assigning teachers to class subjects
 * - Retrieving class schedules and teacher assignments
 */
@Service
@Transactional
public class ClassSubjectService {

    private final ClassSubjectRepository classSubjectRepository;
    private final ClasseRepository classeRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;

    public ClassSubjectService(ClassSubjectRepository classSubjectRepository,
                               ClasseRepository classeRepository,
                               SubjectRepository subjectRepository,
                               TeacherRepository teacherRepository) {
        this.classSubjectRepository = classSubjectRepository;
        this.classeRepository = classeRepository;
        this.subjectRepository = subjectRepository;
        this.teacherRepository = teacherRepository;
    }

    /**
     * Assign a subject to a class with optional teacher assignment
     */
    public ClassSubject assignSubjectToClass(ClassSubjectDTO dto) {
        // Validate class exists
        if (!classeRepository.existsById(dto.getClassId())) {
            throw new RuntimeException("Class not found with id: " + dto.getClassId());
        }

        // Validate subject exists
        if (!subjectRepository.existsById(dto.getSubjectId())) {
            throw new RuntimeException("Subject not found with id: " + dto.getSubjectId());
        }

        // Validate teacher exists (if provided)
        if (dto.getTeacherId() != null && !teacherRepository.existsById(dto.getTeacherId())) {
            throw new RuntimeException("Teacher not found with id: " + dto.getTeacherId());
        }

        // Check if subject already assigned to this class
        if (classSubjectRepository.existsByClassIdAndSubjectId(dto.getClassId(), dto.getSubjectId())) {
            throw new RuntimeException("Subject already assigned to this class");
        }

        ClassSubject classSubject = new ClassSubject();
        classSubject.setClassId(dto.getClassId());
        classSubject.setSubjectId(dto.getSubjectId());
        classSubject.setTeacherId(dto.getTeacherId());
        classSubject.setHoursPerWeek(dto.getHoursPerWeek());

        return classSubjectRepository.save(classSubject);
    }

    /**
     * Update class-subject assignment (mainly for updating teacher or hours)
     */
    public ClassSubject updateClassSubject(UUID id, ClassSubjectDTO dto) {
        ClassSubject classSubject = classSubjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class-subject assignment not found with id: " + id));

        // Validate teacher exists (if provided)
        if (dto.getTeacherId() != null && !teacherRepository.existsById(dto.getTeacherId())) {
            throw new RuntimeException("Teacher not found with id: " + dto.getTeacherId());
        }

        classSubject.setTeacherId(dto.getTeacherId());
        classSubject.setHoursPerWeek(dto.getHoursPerWeek());

        return classSubjectRepository.save(classSubject);
    }

    /**
     * Assign or update teacher for a class-subject
     */
    public ClassSubject assignTeacherToClassSubject(UUID classId, UUID subjectId, UUID teacherId) {
        ClassSubject classSubject = classSubjectRepository.findByClassIdAndSubjectId(classId, subjectId)
                .orElseThrow(() -> new RuntimeException("Class-subject assignment not found"));

        // Validate teacher exists
        if (!teacherRepository.existsById(teacherId)) {
            throw new RuntimeException("Teacher not found with id: " + teacherId);
        }

        classSubject.setTeacherId(teacherId);
        return classSubjectRepository.save(classSubject);
    }

    /**
     * Get all subjects for a class
     */
    @Transactional(readOnly = true)
    public List<ClassSubject> getSubjectsForClass(UUID classId) {
        return classSubjectRepository.findByClassId(classId);
    }

    /**
     * Get all classes where a teacher is assigned
     */
    @Transactional(readOnly = true)
    public List<ClassSubject> getClassesForTeacher(UUID teacherId) {
        return classSubjectRepository.findByTeacherId(teacherId);
    }

    /**
     * Get all classes for a specific subject
     */
    @Transactional(readOnly = true)
    public List<ClassSubject> getClassesForSubject(UUID subjectId) {
        return classSubjectRepository.findBySubjectId(subjectId);
    }

    /**
     * Remove a subject from a class
     */
    public void removeSubjectFromClass(UUID classId, UUID subjectId) {
        if (!classSubjectRepository.existsByClassIdAndSubjectId(classId, subjectId)) {
            throw new RuntimeException("Class-subject assignment not found");
        }
        classSubjectRepository.deleteByClassIdAndSubjectId(classId, subjectId);
    }

    /**
     * Remove all subjects from a class
     */
    public void removeAllSubjectsFromClass(UUID classId) {
        classSubjectRepository.deleteByClassId(classId);
    }

    /**
     * Get a specific class-subject assignment
     */
    @Transactional(readOnly = true)
    public ClassSubject getClassSubject(UUID id) {
        return classSubjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Class-subject assignment not found with id: " + id));
    }
}
