package com.schoolmanagement.controller;

import com.schoolmanagement.entity.Message;
import com.schoolmanagement.repository.MessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageRepository messageRepository;

    public MessageController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping
    public ResponseEntity<List<Message>> getAllMessages() {
        return ResponseEntity.ok(messageRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Message> getMessage(@PathVariable UUID id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        return ResponseEntity.ok(message);
    }

    @GetMapping("/recipient/{recipientId}")
    public ResponseEntity<List<Message>> getMessagesByRecipient(@PathVariable UUID recipientId) {
        return ResponseEntity.ok(messageRepository.findByRecipientId(recipientId));
    }

    @GetMapping("/sender/{senderId}")
    public ResponseEntity<List<Message>> getMessagesBySender(@PathVariable UUID senderId) {
        return ResponseEntity.ok(messageRepository.findBySenderId(senderId));
    }

    @GetMapping("/unread/{recipientId}")
    public ResponseEntity<List<Message>> getUnreadMessages(@PathVariable UUID recipientId) {
        return ResponseEntity.ok(messageRepository.findByRecipientIdAndIsRead(recipientId, false));
    }

    @PostMapping
    public ResponseEntity<Message> createMessage(@RequestBody Message message) {
        Message saved = messageRepository.save(message);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}/mark-read")
    public ResponseEntity<Message> markAsRead(@PathVariable UUID id) {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setIsRead(true);
        Message updated = messageRepository.save(message);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable UUID id) {
        if (!messageRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        messageRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
