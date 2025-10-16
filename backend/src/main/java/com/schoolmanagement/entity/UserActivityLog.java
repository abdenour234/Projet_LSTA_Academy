package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "user_activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "school_id", nullable = false)
    private String schoolId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", insertable = false, updatable = false)
    private School school;

    @Column(name = "activity_type", nullable = false)
    private String activityType;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
