package com.schoolmanagement.service;

import com.schoolmanagement.dto.ActivityWithDetailsDTO;
import com.schoolmanagement.entity.Activity;
import com.schoolmanagement.entity.Classe;
import com.schoolmanagement.entity.Profile;
import com.schoolmanagement.entity.Subject;
import com.schoolmanagement.entity.Teacher;
import com.schoolmanagement.repository.ActivityRepository;
import com.schoolmanagement.repository.ClasseRepository;
import com.schoolmanagement.repository.ProfileRepository;
import com.schoolmanagement.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TeacherActivityService {

    private final ActivityRepository activityRepository;
    private final ClasseRepository classeRepository;
    private final SubjectRepository subjectRepository;
    private final ProfileRepository profileRepository;

    public TeacherActivityService(
            ActivityRepository activityRepository,
            ClasseRepository classeRepository,
            SubjectRepository subjectRepository,
            ProfileRepository profileRepository) {
        this.activityRepository = activityRepository;
        this.classeRepository = classeRepository;
        this.subjectRepository = subjectRepository;
        this.profileRepository = profileRepository;
    }

    public List<ActivityWithDetailsDTO> getTeacherActivitiesWithDetails(UUID teacherId, Long schoolId) {
        System.out.println("=== DEBUG GET TEACHER ACTIVITIES ===");
        System.out.println("TeacherId: " + teacherId);
        System.out.println("SchoolId: " + schoolId);

        List<Activity> activities = activityRepository
                .findActivitiesByTeacherAssignmentsNative(teacherId.toString(), schoolId);

        System.out.println("Found " + activities.size() + " activities");

        if (activities.isEmpty()) {
            System.out.println("NO ACTIVITIES FOUND - Checking data...");
        } else {
            activities.forEach(a -> System.out.println("  Activity: " + a.getTitle() +
                    " | ClassId: " + a.getClassId() +
                    " | SubjectId: " + a.getSubjectId()));
        }
        System.out.println("====================================");

        return activities.stream()
                .map(this::enrichActivityWithDetails)
                .collect(Collectors.toList());
    }

    public List<ActivityWithDetailsDTO> getTeacherApprovedActivities(UUID teacherId, Long schoolId) {
        List<Activity> activities = activityRepository
                .findActivitiesByTeacherAssignmentsAndStatusNative(teacherId.toString(), schoolId, "APPROVED");

        return activities.stream()
                .map(this::enrichActivityWithDetails)
                .collect(Collectors.toList());
    }

    public List<ActivityWithDetailsDTO> getTeacherActivitiesForClass(UUID teacherId, UUID classId, Long schoolId) {
        List<Activity> activities = activityRepository
                .findActivitiesByTeacherAndClassNative(teacherId.toString(), classId.toString(), schoolId);

        return activities.stream()
                .map(this::enrichActivityWithDetails)
                .collect(Collectors.toList());
    }

    private ActivityWithDetailsDTO enrichActivityWithDetails(Activity activity) {
        ActivityWithDetailsDTO dto = new ActivityWithDetailsDTO(activity);

        if (activity.getClassId() != null) {
            classeRepository.findById(activity.getClassId())
                    .ifPresent(classe -> dto.setClassName(classe.getName()));
        }

        if (activity.getSubjectId() != null) {
            subjectRepository.findById(activity.getSubjectId())
                    .ifPresent(subject -> dto.setSubjectName(subject.getName()));
        }

        if (activity.getCreatedBy() != null) {
            profileRepository.findById(activity.getCreatedBy())
                    .ifPresent(profile -> {
                        dto.setTeacherName(profile.getFullName() != null ? profile.getFullName() : "Enseignant");
                        dto.setTeacherId(profile.getId());
                    });
        }

        return dto;
    }
}