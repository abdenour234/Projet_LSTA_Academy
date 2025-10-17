package com.schoolmanagement.repository;

import com.schoolmanagement.entity.School;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolRepository extends JpaRepository<School, Long> {
    List<School> findByCity(String city);
    List<School> findByRegion(String region);
    List<School> findByLevel(String level);
    List<School> findByStatus(String status);
    Optional<School> findByName(String name);
}
