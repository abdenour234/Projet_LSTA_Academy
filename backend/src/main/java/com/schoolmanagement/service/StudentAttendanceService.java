package com.schoolmanagement.service;

import com.schoolmanagement.dto.StudentAttendanceDTO;
import com.schoolmanagement.dto.StudentAttendanceRequest;
import com.schoolmanagement.dto.StudentAttendanceStats;
import com.schoolmanagement.entity.HistoriqueProfesseur;
import com.schoolmanagement.entity.Student;
import com.schoolmanagement.entity.Teacher;
import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.repository.StudentAttendanceRepository;
import com.schoolmanagement.repository.StudentRepository;
import com.schoolmanagement.repository.TeacherRepository;
import com.schoolmanagement.repository.ClasseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentAttendanceService {

    private final StudentAttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ClasseRepository classRepository;

    /**
     * Convertir profile_id en teacher_id si nécessaire
     * Accepte soit un profile_id soit un teacher_id
     */
    private UUID resolveTeacherId(UUID id) {
        log.info("Resolving teacher ID for: {}", id);
        
        // D'abord essayer de le trouver comme teacher_id
        Optional<Teacher> teacherById = teacherRepository.findById(id);
        if (teacherById.isPresent()) {
            log.info("ID {} resolved as teacher_id", id);
            return id;
        }
        
        // Sinon, essayer comme profile_id
        Optional<Teacher> teacherByProfile = teacherRepository.findByProfileId(id);
        if (teacherByProfile.isPresent()) {
            UUID teacherId = teacherByProfile.get().getId();
            log.info("ID {} resolved as profile_id, converted to teacher_id {}", id, teacherId);
            return teacherId;
        }
        
        log.error("No teacher found for ID: {} (tried as both teacher_id and profile_id)", id);
        throw new RuntimeException("Aucun enseignant trouvé pour l'ID: " + id + 
            ". Cet utilisateur n'a peut-être pas de profil enseignant associé.");
    }

    /**
     * Récupérer les classes d'un enseignant (format simple pour le frontend)
     */
    public List<Map<String, String>> getTeacherClasses(Long schoolId, UUID teacherId) {
        log.info("Getting classes for teacher: schoolId={}, teacherId={}", schoolId, teacherId);
        
        // Convertir profile_id en teacher_id si nécessaire
        UUID resolvedTeacherId = resolveTeacherId(teacherId);
        
        Teacher teacher = teacherRepository.findById(resolvedTeacherId)
            .orElseThrow(() -> new RuntimeException("Enseignant non trouvé"));
        
        log.info("Teacher found: {}, schoolId={}", teacher.getId(), teacher.getSchoolId());
        
        if (!teacher.getSchoolId().equals(schoolId)) {
            log.error("Teacher schoolId mismatch: expected={}, actual={}", schoolId, teacher.getSchoolId());
            throw new RuntimeException("L'enseignant n'appartient pas à cette école");
        }

        // Essayer d'abord via class_subjects
        List<Classe> classes = classRepository.findBySchoolIdAndTeacherId(schoolId, resolvedTeacherId);
        log.info("Found {} classes via class_subjects for teacher {}", classes.size(), resolvedTeacherId);
        
        // Si aucune classe via class_subjects, essayer via teacher_classes (fallback)
        if (classes.isEmpty()) {
            log.info("No classes found via class_subjects, trying teacher_classes (legacy)");
            classes = classRepository.findBySchoolIdAndTeacherIdLegacy(schoolId, resolvedTeacherId);
            log.info("Found {} classes via teacher_classes (legacy) for teacher {}", classes.size(), resolvedTeacherId);
        }
        
        // Retourner une liste vide au lieu de lancer une exception si aucune classe n'est trouvée
        if (classes.isEmpty()) {
            log.warn("No classes found for teacher {} in school {}", teacherId, schoolId);
            return new ArrayList<>();
        }
        
        // Convertir en format simple Map pour le frontend
        return classes.stream()
            .map(classe -> {
                Map<String, String> map = new HashMap<>();
                map.put("id", classe.getId().toString());
                map.put("name", classe.getName());
                map.put("level", classe.getLevel() != null ? classe.getLevel() : "");
                return map;
            })
            .collect(Collectors.toList());
    }

    /**
     * Récupérer les étudiants d'une classe (format simple pour le frontend)
     */
    public List<Map<String, String>> getClassStudents(Long schoolId, UUID teacherId, UUID classId) {
        log.info("Getting students for class: schoolId={}, teacherId={}, classId={}", 
                 schoolId, teacherId, classId);
        
        // Convertir profile_id en teacher_id si nécessaire
        UUID resolvedTeacherId = resolveTeacherId(teacherId);
        
        // Vérifier que l'enseignant a accès à cette classe
        Teacher teacher = teacherRepository.findById(resolvedTeacherId)
            .orElseThrow(() -> new RuntimeException("Enseignant non trouvé"));
        
        if (!teacher.getSchoolId().equals(schoolId)) {
            throw new RuntimeException("L'enseignant n'appartient pas à cette école");
        }

        // Essayer d'abord via class_subjects
        List<Classe> teacherClasses = classRepository.findBySchoolIdAndTeacherId(schoolId, resolvedTeacherId);
        
        // Si aucune classe via class_subjects, essayer via teacher_classes (fallback)
        if (teacherClasses.isEmpty()) {
            log.info("No classes found via class_subjects, trying teacher_classes (legacy)");
            teacherClasses = classRepository.findBySchoolIdAndTeacherIdLegacy(schoolId, resolvedTeacherId);
        }
        
        boolean hasAccess = teacherClasses.stream()
            .anyMatch(c -> c.getId().equals(classId));
        
        if (!hasAccess) {
            throw new RuntimeException("Vous n'avez pas accès à cette classe");
        }

        List<Student> students = studentRepository.findBySchoolIdAndClassId(schoolId, classId);
        log.info("Found {} students for class {}", students.size(), classId);
        
        // Convertir en format simple Map pour le frontend
        return students.stream()
            .map(student -> {
                Map<String, String> map = new HashMap<>();
                map.put("id", student.getId().toString());
                map.put("name", student.getFirstName() + " " + student.getLastName());
                map.put("massar", student.getMassar());
                return map;
            })
            .collect(Collectors.toList());
    }

    /**
     * Enregistrer les absences en masse pour une date donnée
     */
    @Transactional
    public List<StudentAttendanceDTO> recordBulkAbsences(UUID teacherId, StudentAttendanceRequest request) {
        log.info("Recording bulk absences: teacherId={}, schoolId={}, classId={}, date={}, count={}", 
                 teacherId, request.getSchoolId(), request.getClassId(), 
                 request.getEventDate(), request.getAbsentStudents().size());
        
        // Convertir profile_id en teacher_id si nécessaire
        UUID resolvedTeacherId = resolveTeacherId(teacherId);
        
        // Vérifier que l'enseignant a accès à cette classe
        Teacher teacher = teacherRepository.findById(resolvedTeacherId)
            .orElseThrow(() -> new RuntimeException("Enseignant non trouvé"));
        
        if (!teacher.getSchoolId().equals(request.getSchoolId())) {
            throw new RuntimeException("L'enseignant n'appartient pas à cette école");
        }
        
        // Essayer d'abord via class_subjects
        List<Classe> teacherClasses = classRepository.findBySchoolIdAndTeacherId(
            request.getSchoolId(), resolvedTeacherId
        );
        
        // Si aucune classe via class_subjects, essayer via teacher_classes (fallback)
        if (teacherClasses.isEmpty()) {
            log.info("No classes found via class_subjects, trying teacher_classes (legacy)");
            teacherClasses = classRepository.findBySchoolIdAndTeacherIdLegacy(
                request.getSchoolId(), resolvedTeacherId
            );
        }
        
        boolean hasAccess = teacherClasses.stream()
            .anyMatch(c -> c.getId().equals(request.getClassId()));
        
        if (!hasAccess) {
            throw new RuntimeException("Vous n'avez pas accès à cette classe");
        }

        List<HistoriqueProfesseur> savedRecords = new ArrayList<>();

        for (StudentAttendanceRequest.AbsentStudent absentStudent : request.getAbsentStudents()) {
            // Vérifier si une absence existe déjà pour cet étudiant à cette date
            boolean exists = attendanceRepository.existsByStudentAndDate(
                request.getSchoolId(),
                absentStudent.getStudentId(),
                request.getEventDate()
            );

            if (exists) {
                log.warn("Absence already exists for student {} on date {}", 
                         absentStudent.getStudentId(), request.getEventDate());
                continue; // Ignorer les doublons
            }

            HistoriqueProfesseur record = HistoriqueProfesseur.builder()
                .schoolId(request.getSchoolId())
                .teacherId(resolvedTeacherId)
                .classId(request.getClassId())
                .studentId(absentStudent.getStudentId())
                .eventType(HistoriqueProfesseur.EventType.ABSENCE)
                .eventDate(request.getEventDate())
                .reason(absentStudent.getReason())
                .isJustified(absentStudent.getIsJustified() != null ? absentStudent.getIsJustified() : false)
                .teacherNotes(absentStudent.getTeacherNotes())
                .build();

            savedRecords.add(attendanceRepository.save(record));
        }

        log.info("Successfully saved {} absence records", savedRecords.size());

        return savedRecords.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Récupérer les absences d'une classe pour une période
     */
    public List<StudentAttendanceDTO> getClassAttendance(
        Long schoolId,
        UUID teacherId,
        UUID classId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        // Convertir profile_id en teacher_id si nécessaire
        UUID resolvedTeacherId = resolveTeacherId(teacherId);
        
        // Vérifier l'accès
        Teacher teacher = teacherRepository.findById(resolvedTeacherId)
            .orElseThrow(() -> new RuntimeException("Enseignant non trouvé"));
        
        if (!teacher.getSchoolId().equals(schoolId)) {
            throw new RuntimeException("L'enseignant n'appartient pas à cette école");
        }
        
        // Essayer d'abord via class_subjects
        List<Classe> teacherClasses = classRepository.findBySchoolIdAndTeacherId(schoolId, resolvedTeacherId);
        
        // Si aucune classe via class_subjects, essayer via teacher_classes (fallback)
        if (teacherClasses.isEmpty()) {
            log.info("No classes found via class_subjects, trying teacher_classes (legacy)");
            teacherClasses = classRepository.findBySchoolIdAndTeacherIdLegacy(schoolId, resolvedTeacherId);
        }
        
        boolean hasAccess = teacherClasses.stream()
            .anyMatch(c -> c.getId().equals(classId));
        
        if (!hasAccess) {
            throw new RuntimeException("Vous n'avez pas accès à cette classe");
        }

        List<HistoriqueProfesseur> records = attendanceRepository.findByTeacherClassAndDateRange(
            schoolId, resolvedTeacherId, classId, startDate, endDate
        );

        return records.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Récupérer les statistiques par étudiant pour une classe
     */
    public List<StudentAttendanceStats> getClassAttendanceStats(
        Long schoolId,
        UUID teacherId,
        UUID classId
    ) {
        // Vérifier l'accès
        List<Student> students = studentRepository.findBySchoolIdAndClassId(schoolId, classId);

        return students.stream()
            .map(student -> {
                Long total = attendanceRepository.countAbsencesByStudent(schoolId, student.getId());
                Long justified = attendanceRepository.countJustifiedAbsencesByStudent(schoolId, student.getId());
                Long unjustified = attendanceRepository.countUnjustifiedAbsencesByStudent(schoolId, student.getId());

                return StudentAttendanceStats.builder()
                    .studentId(student.getId())
                    .studentName(student.getFirstName() + " " + student.getLastName())
                    .totalAbsences(total)
                    .justifiedAbsences(justified)
                    .unjustifiedAbsences(unjustified)
                    .build();
            })
            .collect(Collectors.toList());
    }

    /**
     * Modifier le statut de justification d'une absence
     */
    @Transactional
    public StudentAttendanceDTO updateJustificationStatus(
        UUID attendanceId,
        UUID teacherId,
        Boolean isJustified,
        String teacherNotes
    ) {
        // Convertir profile_id en teacher_id si nécessaire
        UUID resolvedTeacherId = resolveTeacherId(teacherId);
        
        HistoriqueProfesseur record = attendanceRepository.findById(attendanceId)
            .orElseThrow(() -> new RuntimeException("Absence non trouvée"));

        // Vérifier que l'enseignant est le propriétaire de cet enregistrement
        if (!record.getTeacherId().equals(resolvedTeacherId)) {
            throw new RuntimeException("Vous n'avez pas l'autorisation de modifier cette absence");
        }

        record.setIsJustified(isJustified);
        if (teacherNotes != null) {
            record.setTeacherNotes(teacherNotes);
        }

        HistoriqueProfesseur updated = attendanceRepository.save(record);
        return convertToDTO(updated);
    }

    /**
     * Supprimer une absence
     */
    @Transactional
    public void deleteAttendance(UUID attendanceId, UUID teacherId) {
        // Convertir profile_id en teacher_id si nécessaire
        UUID resolvedTeacherId = resolveTeacherId(teacherId);
        
        HistoriqueProfesseur record = attendanceRepository.findById(attendanceId)
            .orElseThrow(() -> new RuntimeException("Absence non trouvée"));

        // Vérifier que l'enseignant est le propriétaire
        if (!record.getTeacherId().equals(resolvedTeacherId)) {
            throw new RuntimeException("Vous n'avez pas l'autorisation de supprimer cette absence");
        }

        attendanceRepository.delete(record);
    }

    /**
     * Convertir une entité en DTO
     */
    private StudentAttendanceDTO convertToDTO(HistoriqueProfesseur record) {
        Student student = studentRepository.findById(record.getStudentId()).orElse(null);
        Teacher teacher = teacherRepository.findById(record.getTeacherId()).orElse(null);
        Classe classEntity = classRepository.findById(record.getClassId()).orElse(null);

        return StudentAttendanceDTO.builder()
            .id(record.getId())
            .schoolId(record.getSchoolId())
            .teacherId(record.getTeacherId())
            .teacherName(teacher != null ? (teacher.getProfile() != null ? teacher.getProfile().getFullName() : "Inconnu") : "Inconnu")
            .classId(record.getClassId())
            .className(classEntity != null ? classEntity.getName() : "Inconnue")
            .studentId(record.getStudentId())
            .studentName(student != null ? (student.getFirstName() + " " + student.getLastName()) : "Inconnu")
            .eventDate(record.getEventDate())
            .reason(record.getReason())
            .isJustified(record.getIsJustified())
            .teacherNotes(record.getTeacherNotes())
            .createdAt(record.getCreatedAt())
            .updatedAt(record.getUpdatedAt())
            .build();
    }
}