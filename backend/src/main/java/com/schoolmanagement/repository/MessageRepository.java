package com.schoolmanagement.repository;

import com.schoolmanagement.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findBySchoolId(String schoolId);
    List<Message> findBySenderId(UUID senderId);
    List<Message> findByRecipientId(UUID recipientId);
    List<Message> findByRecipientIdAndIsRead(UUID recipientId, Boolean isRead);
    List<Message> findBySchoolIdAndRecipientId(String schoolId, UUID recipientId);
    Long countByRecipientIdAndIsRead(UUID recipientId, Boolean isRead);
}
