package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Activity;
import com.schoolmanagement.repository.ActivityRepository;
import com.schoolmanagement.security.ResourceOwnershipValidator;
import com.schoolmanagement.security.ResourceOwnershipValidator.UserContext;
import com.schoolmanagement.util.InputSanitizer;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.schoolmanagement.entity.ClassSubject;
import com.schoolmanagement.service.ClassSubjectService;
import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.entity.Subject;
import com.schoolmanagement.repository.ClasseRepository;
import com.schoolmanagement.repository.SubjectRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.entity.Teacher;
import com.schoolmanagement.repository.TeacherRepository;
import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;  // ← À AJOUTER
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "*")
public class ActivityController {

    private final ActivityRepository activityRepository;
    private final ResourceOwnershipValidator ownershipValidator;
    private final InputSanitizer inputSanitizer;
    private final ClassSubjectService classSubjectService;
    private final ClasseRepository classeRepository;
    private final SubjectRepository subjectRepository;
    private final ProfileRepository profileRepository;
    private final TeacherRepository teacherRepository;

    public ActivityController(ActivityRepository activityRepository,
                            ResourceOwnershipValidator ownershipValidator,
                            InputSanitizer inputSanitizer,
                            ClassSubjectService classSubjectService,
                            ClasseRepository classeRepository,
                            SubjectRepository subjectRepository,
                            ProfileRepository profileRepository,
                            TeacherRepository teacherRepository) {
        this.activityRepository = activityRepository;
        this.ownershipValidator = ownershipValidator;
        this.inputSanitizer = inputSanitizer;
        this.classSubjectService = classSubjectService;
        this.classeRepository = classeRepository;
        this.subjectRepository = subjectRepository;
        this.profileRepository = profileRepository;
        this.teacherRepository = teacherRepository;
    }

        @GetMapping("/teacher/my-activities")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<ActivityResponse>> getMyActivities(
            @RequestParam(required = false) Boolean onlyPublished,
            @RequestParam(required = false) String approvalStatus) {

        // Récupère l'ID du prof connecté depuis le JWT
        UUID teacherId = getCurrentTeacherId();
        System.out.println("=== DEBUG PROF CONNECTÉ ===");
System.out.println("Teacher ID extrait : " + teacherId);

List<ClassSubject> assignments = classSubjectService.getClassesForTeacher(teacherId);
System.out.println("Nombre d'affectations trouvées : " + (assignments != null ? assignments.size() : "null"));

if (assignments != null) {
    assignments.forEach(a -> System.out.println("→ Classe: " + a.getClassId() + " | Matière: " + a.getSubjectId()));
}
System.out.println("================================");

        // Récupère toutes les affectations du prof

        if (assignments == null || assignments.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<UUID> allowedClassIds = assignments.stream()
                .map(ClassSubject::getClassId)
                .toList();

        List<UUID> allowedSubjectIds = assignments.stream()
                .map(ClassSubject::getSubjectId)
                .toList();

        // Requête personnalisée dans ActivityRepository
        List<Activity> activities = activityRepository.findByClassIdInAndSubjectIdIn(
                allowedClassIds, allowedSubjectIds);

        // Filtres optionnels
        if (Boolean.TRUE.equals(onlyPublished)) {
            activities = activities.stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsPublished()))
                    .toList();
        }
        if (approvalStatus != null && !approvalStatus.isBlank()) {
            activities = activities.stream()
                    .filter(a -> approvalStatus.equalsIgnoreCase(a.getApprovalStatus()))
                    .toList();
        }

        // Enrichissement avec noms
        List<ActivityResponse> response = activities.stream()
                .map(this::toActivityResponse)
                .toList();

        return ResponseEntity.ok(response);
    }

    // Méthode utilitaire pour extraire l'ID du prof depuis le token JWT
    

    private UUID getCurrentTeacherId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == null) {
            throw new RuntimeException("Utilisateur non authentifié");
        }

        String email;

        if (auth.getPrincipal() instanceof String str) {
            email = str.trim();
        }
        else if (auth.getPrincipal().getClass().getName().contains("Jwt")) {
            try {
                var method = auth.getPrincipal().getClass().getMethod("getClaimAsString", String.class);
                email = (String) method.invoke(auth.getPrincipal(), "sub");
                if (email == null || email.isBlank()) {
                    email = (String) method.invoke(auth.getPrincipal(), "email");
                }
            } catch (Exception e) {
                email = auth.getName();
            }
        }
        else {
            email = auth.getName();
        }

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email non trouvé dans le token");
        }

        Profile profile = profileRepository.findByEmail(email);
        if (profile == null) {
            throw new RuntimeException("Aucun profil trouvé avec l'email : " + email);
        }

        // Avant (buggé) :
// return profile.getId();  // ← tu renvoies le profile_id !!

// Après (corrigé) :
Teacher teacher = teacherRepository.findByProfileId(profile.getId())
    .orElseThrow(() -> new RuntimeException("Enseignant non trouvé pour ce profil"));
return teacher.getId();  // ← tu renvoies le vrai teacher.id !!
    }
    // DTO pour avoir une belle réponse
    public record ActivityResponse(
            UUID id,
            String title,
            String type,
            String nature,
            String level,
            Boolean isPublished,
            String approvalStatus,
            String className,
            String subjectName,
            LocalDateTime createdAt
    ) {}

    private ActivityResponse toActivityResponse(Activity activity) {
        String className = classeRepository.findById(activity.getClassId())
                .map(Classe::getName)
                .orElse("Classe inconnue");

        String subjectName = subjectRepository.findById(activity.getSubjectId())
                .map(Subject::getName)
                .orElse("Matière inconnue");

        return new ActivityResponse(
                activity.getId(),
                activity.getTitle(),
                activity.getType(),
                activity.getNature(),
                activity.getLevel(),
                activity.getIsPublished(),
                activity.getApprovalStatus(),
                className,
                subjectName,
                activity.getCreatedAt()
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Activity>> getAllActivities() {
        return ResponseEntity.ok(activityRepository.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<Activity> getActivity(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        // Ownership validation
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        if (!ownershipValidator.canAccessActivity(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(activity);
    }

    @GetMapping("/school/{schoolId}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Activity>> getActivitiesBySchool(@PathVariable Long schoolId) {
        return ResponseEntity.ok(activityRepository.findBySchoolId(schoolId));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<List<Activity>> getActivitiesByType(@PathVariable String type) {
        return ResponseEntity.ok(activityRepository.findByType(type));
    }

    @GetMapping("/published")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER', 'STUDENT')")
    public ResponseEntity<List<Activity>> getPublishedActivities(
            @RequestParam Long schoolId,
            @RequestParam(required = false) UUID classId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Extract user context to determine role
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        List<Activity> activities;
        
        // For students, only return APPROVED activities
        // For teachers and admins, return all published activities
        if ("STUDENT".equals(user.role)) {
            if (classId != null) {
                activities = activityRepository.findBySchoolIdAndClassIdAndApprovalStatus(schoolId, classId, "APPROVED");
            } else {
                activities = activityRepository.findBySchoolIdAndApprovalStatus(schoolId, "APPROVED");
            }
        } else {
            // Teachers and admins see all published activities regardless of approval
            if (classId != null) {
                activities = activityRepository.findBySchoolIdAndClassId(schoolId, classId);
            } else {
                activities = activityRepository.findBySchoolId(schoolId);
            }
        }
        
        return ResponseEntity.ok(activities);
    }

   
    @GetMapping("/pending-count")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Map<String, Integer>> getPendingCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        List<Activity> pendingActivities = activityRepository.findByNatureAndApprovalStatus(
            "fait maison", "PENDING"
        );
        
        return ResponseEntity.ok(Map.of("count", pendingActivities.size()));
    }

 // ...existing code...

    @GetMapping("/pending-approval")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<List<Activity>> getPendingApproval(
            @RequestParam(required = false) UUID subjectId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        List<Activity> pendingActivities;
        
        if (subjectId != null) {
            pendingActivities = activityRepository.findBySubjectIdAndNatureAndApprovalStatus(
                subjectId, "fait maison", "PENDING"
            );
        } else {
            pendingActivities = activityRepository.findByNatureAndApprovalStatus(
                "fait maison", "PENDING"
            );
        }
        
        return ResponseEntity.ok(pendingActivities);
    }

// ...existing code...

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Activity> approveActivity(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        // Only "fait maison" activities can be approved/denied
        if (!"fait maison".equals(activity.getNature())) {
            return ResponseEntity.badRequest().build();
        }
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        activity.setApprovalStatus("APPROVED");
        activity.setApprovedBy(user.userId); // Changed: removed UUID.fromString()
        Activity updated = activityRepository.save(activity);
        
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/deny")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<Activity> denyActivity(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found"));
        
        // Only "fait maison" activities can be approved/denied
        if (!"fait maison".equals(activity.getNature())) {
            return ResponseEntity.badRequest().build();
        }
        
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        
        activity.setApprovalStatus("DENIED");
        activity.setApprovedBy(user.userId); // Changed: removed UUID.fromString()
        Activity updated = activityRepository.save(activity);
        
        return ResponseEntity.ok(updated);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Activity> createActivity(
            @RequestBody Activity activity,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        System.out.println("=== CREATE ACTIVITY DEBUG ===");
        System.out.println("Received activity:");
        System.out.println("  Title: " + activity.getTitle());
        System.out.println("  SubjectId: " + activity.getSubjectId());
        System.out.println("  ClassId: " + activity.getClassId());
        System.out.println("  SchoolId: " + activity.getSchoolId());
        System.out.println("  Type: " + activity.getType());
        System.out.println("  Nature: " + activity.getNature());
        System.out.println("  Level: " + activity.getLevel());
        System.out.println("  IsPublished: " + activity.getIsPublished());
        System.out.println("  ApprovalStatus: " + activity.getApprovalStatus());
        
        // Validate nature
        if (activity.getNature() != null) {
            String n = activity.getNature();
            if (!"Classe".equals(n) && !"fait maison".equals(n)) {
                return ResponseEntity.badRequest().build();
            }
            activity.setNature(inputSanitizer.sanitizeText(n));
        } else {
            activity.setNature("Classe"); // default
        }
        
        // Sanitize text inputs
        if (activity.getTitle() != null) {
            activity.setTitle(inputSanitizer.sanitizeText(activity.getTitle()));
        }
        if (activity.getDescription() != null) {
            activity.setDescription(inputSanitizer.sanitizeForHtml(activity.getDescription()));
        }
        
        // Ownership validation - ensure user can create in this school
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        if (!ownershipValidator.belongsToSchool(user, activity.getSchoolId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        Activity saved = activityRepository.save(activity);
        System.out.println("Activity saved successfully:");
        System.out.println("  ID: " + saved.getId());
        System.out.println("  ClassId: " + saved.getClassId());
        System.out.println("  SubjectId: " + saved.getSubjectId());
        System.out.println("  Nature: " + saved.getNature());
        System.out.println("  ApprovalStatus: " + saved.getApprovalStatus());
        System.out.println("================================");
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'TEACHER')")
    public ResponseEntity<Activity> updateActivity(
            @PathVariable UUID id, 
            @RequestBody Activity activity,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!activityRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Ownership validation
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        if (!ownershipValidator.canModifyActivity(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // Validate nature if provided
        if (activity.getNature() != null) {
            String n = activity.getNature();
            if (!"Classe".equals(n) && !"fait maison".equals(n)) {
                return ResponseEntity.badRequest().build();
            }
            activity.setNature(inputSanitizer.sanitizeText(n));
        }
        
        // Sanitize text inputs
        if (activity.getTitle() != null) {
            activity.setTitle(inputSanitizer.sanitizeText(activity.getTitle()));
        }
        if (activity.getDescription() != null) {
            activity.setDescription(inputSanitizer.sanitizeForHtml(activity.getDescription()));
        }
        
        activity.setId(id);
        Activity updated = activityRepository.save(activity);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN')")
    public ResponseEntity<Void> deleteActivity(
            @PathVariable UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        if (!activityRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Ownership validation
        UserContext user = ownershipValidator.extractUserContext(authHeader);
        if (!ownershipValidator.canModifyActivity(user, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        activityRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

