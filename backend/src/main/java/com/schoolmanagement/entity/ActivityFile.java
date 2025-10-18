package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a file attached to an activity.
 * Files are stored in MinIO with a 7-day TTL.
 */
@Entity
@Table(name = "activity_files")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityFile {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "activity_id", nullable = false)
    private UUID activityId;

    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType; // 'pdf', 'image', 'video', 'text'

    @Column(name = "file_name", nullable = false)
    private String fileName; // Original filename

    @Column(name = "minio_key", nullable = false, unique = true)
    private String minioKey; // Unique key in MinIO bucket (UUID-based)

    @Column(name = "file_size")
    private Long fileSize; // Size in bytes

    @Column(name = "mime_type", length = 100)
    private String mimeType; // e.g., 'application/pdf', 'image/png'

    @Column(name = "position")
    private Integer position; // Order in activity (for sorting)

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "element_id", length = 100)
    private String elementId; // Reference to element in layoutData JSON

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (position == null) {
            position = 0;
        }
    }
}
