package com.schoolmanagement.service;

import com.schoolmanagement.dto.SubjectDTO;
import com.schoolmanagement.entity.Subject;
import com.schoolmanagement.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * SubjectService
 * Service layer for managing school subjects.
 * 
 * Sprint 1 - Ticket 7: Service for subject management
 * Handles business logic for:
 * - Creating and updating subjects
 * - Retrieving subjects by school
 * - Validating subject uniqueness within a school
 */
@Service
@Transactional
public class SubjectService {

    private final SubjectRepository subjectRepository;

    public SubjectService(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    /**
     * Create a new subject for a school
     */
    public Subject createSubject(SubjectDTO dto) {
        // Check if subject already exists for this school
        if (subjectRepository.existsBySchoolIdAndName(dto.getSchoolId(), dto.getName())) {
            throw new RuntimeException("Subject with name '" + dto.getName() + "' already exists for this school");
        }

        Subject subject = new Subject();
        subject.setSchoolId(dto.getSchoolId());
        subject.setName(dto.getName());
        subject.setDescription(dto.getDescription());
        subject.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);

        return subjectRepository.save(subject);
    }

    /**
     * Update an existing subject
     */
    public Subject updateSubject(UUID id, SubjectDTO dto) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found with id: " + id));

        // Check if name change conflicts with existing subject
        if (!subject.getName().equals(dto.getName()) &&
                subjectRepository.existsBySchoolIdAndName(dto.getSchoolId(), dto.getName())) {
            throw new RuntimeException("Subject with name '" + dto.getName() + "' already exists for this school");
        }

        subject.setName(dto.getName());
        subject.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) {
            subject.setIsActive(dto.getIsActive());
        }

        return subjectRepository.save(subject);
    }

    /**
     * Get all subjects for a school
     */
    @Transactional(readOnly = true)
    public List<Subject> getSubjectsBySchool(Long schoolId) {
        return subjectRepository.findBySchoolId(schoolId);
    }

    /**
     * Get all active subjects for a school
     */
    @Transactional(readOnly = true)
    public List<Subject> getActiveSubjectsBySchool(Long schoolId) {
        return subjectRepository.findBySchoolIdAndIsActiveTrue(schoolId);
    }

    /**
     * Get a specific subject by ID
     */
    @Transactional(readOnly = true)
    public Subject getSubjectById(UUID id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found with id: " + id));
    }

    /**
     * Delete a subject
     */
    public void deleteSubject(UUID id) {
        if (!subjectRepository.existsById(id)) {
            throw new RuntimeException("Subject not found with id: " + id);
        }
        subjectRepository.deleteById(id);
    }

    /**
     * Toggle subject active status
     */
    public Subject toggleSubjectStatus(UUID id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found with id: " + id));
        
        subject.setIsActive(!subject.getIsActive());
        return subjectRepository.save(subject);
    }
}
