package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {
    List<Resource> findBySchoolId(String schoolId);
    List<Resource> findByType(String type);
    List<Resource> findByCategory(String category);
    List<Resource> findBySchoolIdAndType(String schoolId, String type);
    List<Resource> findBySchoolIdAndCategory(String schoolId, String category);
    List<Resource> findByUploadedBy(UUID uploadedBy);
}
