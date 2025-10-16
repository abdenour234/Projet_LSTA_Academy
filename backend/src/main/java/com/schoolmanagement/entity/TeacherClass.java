package com.schoolmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "teacher_classes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"teacher_id", "class_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeacherClass {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "teacher_id", nullable = false)
    private UUID teacherId;

    @Column(name = "class_id", nullable = false)
    private UUID classId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "class_id", insertable = false, updatable = false)
    private Classe classe;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
