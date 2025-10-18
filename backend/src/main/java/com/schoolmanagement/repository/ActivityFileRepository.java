package com.schoolmanagement.repository;

import com.schoolmanagement.entity.ActivityFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityFileRepository extends JpaRepository<ActivityFile, UUID> {
    
    /**
     * Find all files for a specific activity, ordered by position.
     */
    List<ActivityFile> findByActivityIdOrderByPositionAsc(UUID activityId);
    
    /**
     * Delete all files for a specific activity.
     */
    void deleteByActivityId(UUID activityId);
    
    /**
     * Find file by MinIO key.
     */
    ActivityFile findByMinioKey(String minioKey);
    
    /**
     * Count files for a specific activity.
     */
    long countByActivityId(UUID activityId);
}
