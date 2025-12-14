/**
 * API Service for Internal Messaging System
 * Handles conversations, messages, and file attachments
 */

import api from './api';
import { validateUUID, assertValidUUID } from './uuidValidation';

export interface Conversation {
  id: string;
  participantId: string;
  schoolId: number;
  participantName?: string;
  participantRole?: string;
  lastMessagePreview?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  recipientName?: string;
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  readBy?: string;
  hasAttachments: boolean;
  attachmentCount: number;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt?: string;
  schoolId: number;
}

export interface Attachment {
  id: string;
  messageId: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  fileSizeFormatted: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  scanStatus: string;
  downloadUrl?: string;
  isSafe: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SendMessageRequest {
  conversationId: string;
  subject: string;
  content: string;
  attachments?: File[];
}

export interface PresignedUrl {
  url: string;
  expiresIn: number;
  method: string;
  uploadId?: string;
}

class MessagingService {
  
  // ========== CONVERSATIONS ==========
  
  /**
   * Create or get existing conversation with a user
   */
  async createOrGetConversation(participantId: string, schoolId: number): Promise<Conversation> {
    const response = await api.post<Conversation>(
      `/messaging/conversations`,
      { participantId, schoolId }
    );
    return response;
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(page: number = 0, size: number = 20): Promise<PagedResponse<Conversation>> {
    const response = await api.get<PagedResponse<Conversation>>(
      `/messaging/conversations?page=${page}&size=${size}`
    );
    return response;
  }

  /**
   * Get specific conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    assertValidUUID(conversationId, 'conversationId');
    const response = await api.get<Conversation>(`/messaging/conversations/${conversationId}`);
    return response;
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, schoolId: number): Promise<void> {
    await api.delete(`/messaging/conversations/${conversationId}?schoolId=${schoolId}`);
  }

  // ========== MESSAGES ==========

  /**
   * Send a new message with optional file attachments
   */
  async sendMessage(request: SendMessageRequest, schoolId: number): Promise<Message> {
    const formData = new FormData();
    formData.append('conversationId', request.conversationId);
    formData.append('subject', request.subject);
    formData.append('content', request.content);

    if (request.attachments && request.attachments.length > 0) {
      request.attachments.forEach((file) => {
        formData.append('attachments', file);
      });
    }

    const response = await api.post<Message>(
      `/messaging/enhanced?schoolId=${schoolId}`,
      formData,
      {}
    );
    return response;
  }

  /**
   * Get messages in a conversation with pagination
   */
  async getConversationMessages(
    conversationId: string,
    schoolId: number,
    page: number = 0,
    size: number = 50
  ): Promise<PagedResponse<Message>> {
    assertValidUUID(conversationId, 'conversationId');
    const response = await api.get<PagedResponse<Message>>(
      `/messaging/enhanced/conversation/${conversationId}?schoolId=${schoolId}&page=${page}&size=${size}`
    );
    return response;
  }

  /**
   * Search messages in a conversation
   */
  async searchMessages(
    conversationId: string,
    query: string,
    schoolId: number,
    page: number = 0,
    size: number = 50
  ): Promise<PagedResponse<Message>> {
    const response = await api.get<PagedResponse<Message>>(
      `/messaging/enhanced/conversation/${conversationId}/search`,
      {
        params: { query, schoolId, page, size },
      }
    );
    return response;
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string, schoolId: number): Promise<Message> {
    const response = await api.put<Message>(
      `/messaging/enhanced/${messageId}/read?schoolId=${schoolId}`
    );
    return response;
  }

  /**
   * Mark all messages in conversation as read
   */
  async markAllMessagesAsRead(conversationId: string, schoolId: number): Promise<void> {
    await api.put(`/messaging/enhanced/conversation/${conversationId}/read-all?schoolId=${schoolId}`);
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get<{ unreadCount: number }>('/messaging/enhanced/unread-count');
    return response.unreadCount || 0;
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, schoolId: number): Promise<void> {
    await api.delete(`/messaging/enhanced/${messageId}?schoolId=${schoolId}`);
  }

  // ========== FILE ATTACHMENTS ==========

  /**
   * Upload a file attachment directly
   */
  async uploadAttachment(file: File, messageId: string, schoolId: number): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Attachment>(
      `/messaging/attachments/upload?messageId=${messageId}&schoolId=${schoolId}`,
      formData,
      {}
    );
    return response;
  }

  /**
   * Generate presigned URL for upload
   */
  async generateUploadUrl(filename: string, messageId: string, schoolId: number): Promise<PresignedUrl> {
    const response = await api.post<PresignedUrl>(
      `/messaging/attachments/presigned-upload-url?filename=${filename}&messageId=${messageId}&schoolId=${schoolId}`
    );
    return response;
  }

  /**
   * Generate presigned URL for download
   */
  async generateDownloadUrl(attachmentId: string, schoolId: number): Promise<PresignedUrl> {
    const response = await api.get<PresignedUrl>(
      `/messaging/attachments/${attachmentId}/download-url?schoolId=${schoolId}`
    );
    return response;
  }

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string, schoolId: number): Promise<void> {
    await api.delete(`/messaging/attachments/${attachmentId}?schoolId=${schoolId}`);
  }

  /**
   * Download a file using presigned URL
   */
  async downloadFile(attachment: Attachment): Promise<void> {
    if (!attachment.downloadUrl) {
      throw new Error('Download URL not available');
    }

    // Open download URL in new window
    const link = document.createElement('a');
    link.href = attachment.downloadUrl;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const messagingService = new MessagingService();
export default messagingService;
