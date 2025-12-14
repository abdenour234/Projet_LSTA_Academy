/**
 * MessagingDashboard - Main component for internal messaging
 * Shows list of conversations and selected conversation thread
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import messagingService, { Conversation, Message } from '@/lib/messagingApi';
import useMessagingWebSocket from '@/hooks/useMessagingWebSocket';
import useDebounce from '@/hooks/useDebounce';
import NewConversationDialog from '@/components/messaging/NewConversationDialog';
import { MessageSquare, Users, Send, Paperclip, Search, X, CheckCheck, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MessagingDashboardProps {
  embedded?: boolean;
}

export default function MessagingDashboard({ embedded = false }: MessagingDashboardProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search term to avoid filtering on every keystroke
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Get schoolId safely - validate it exists
  const schoolId = user?.schoolId ? parseInt(user.schoolId) : undefined;

  const handleDownloadAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        const presigned = await messagingService.generateDownloadUrl(attachmentId, schoolId!);
        window.open(presigned.url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('[MESSAGING] Failed to download attachment:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de télécharger la pièce jointe',
          variant: 'destructive',
        });
      }
    },
    [schoolId]
  );

  // Guard: Cannot use messaging without schoolId
  if (!schoolId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-8">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-700 font-semibold mb-2">École non définie</p>
          <p className="text-gray-500 text-sm">Impossible d'accéder à la messagerie sans école assignée.</p>
        </div>
      </div>
    );
  }

  console.log('[MESSAGING] User context:', { userId: user?.id, schoolId, role: user?.role });

  // WebSocket for real-time notifications
  const { isConnected, error: wsError } = useMessagingWebSocket({
    userId: user?.id ? String(user.id) : '',
    onNewMessage: handleNewMessage,
    onReadReceipt: handleReadReceipt,
    autoConnect: true,
  });

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  // Load conversations list
  const loadConversations = async () => {
    if (!user?.id) {
      console.warn('[MESSAGING] No user ID, skipping conversation load');
      return;
    }
    
    try {
      setLoading(true);
      console.log('[MESSAGING] Loading conversations for user:', user.id);
      const response = await messagingService.getConversations(0, 50);
      console.log('[MESSAGING] Conversations loaded:', response);
      setConversations(response.content || []);
    } catch (error) {
      console.error('[MESSAGING] Failed to load conversations:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    try {
      const count = await messagingService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  // Load messages for selected conversation
  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      console.log('[MESSAGING] Loading messages:', { conversationId, schoolId });
      const response = await messagingService.getConversationMessages(
        conversationId,
        schoolId,
        0,
        100
      );
      console.log('[MESSAGING] Messages loaded:', response);
      setMessages(response.content || []); // Keep backend order (DESC - newest first)
    } catch (error) {
      console.error('[MESSAGING] Failed to load messages:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    
    // Decrement unread count by conversation's unread
    if (conversation.unreadCount && conversation.unreadCount > 0) {
      setUnreadCount(prev => Math.max(0, prev - conversation.unreadCount!));
    }
    
    // Mark all messages as read
    messagingService.markAllMessagesAsRead(conversation.id, schoolId);
  };

  // Handle new message via WebSocket
  function handleNewMessage(message: any) {
    // Increment unread count locally (avoid API call)
    setUnreadCount(prev => prev + 1);

    // Refresh conversations list to update preview
    loadConversations();

    // If message is for current conversation, add it
    if (selectedConversation && message.conversationId === selectedConversation.id) {
      loadMessages(selectedConversation.id);
      // Decrement since we're viewing it
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Show toast notification
    toast({
      title: 'Nouveau message',
      description: message.preview,
    });
  }

  // Handle read receipt
  function handleReadReceipt(receipt: any) {
    // Update message read status in UI
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === receipt.messageId
          ? { ...msg, isRead: true, readAt: receipt.readAt, readBy: receipt.readBy }
          : msg
      )
    );
  }

  // Send a new message
  const handleSendMessage = async () => {
    if (!selectedConversation || (!messageContent.trim() && attachments.length === 0)) {
      return;
    }

    try {
      setLoading(true);
      
      console.log('[MESSAGING] Sending message:', { 
        conversationId: selectedConversation.id, 
        schoolId,
        hasAttachments: attachments.length > 0 
      });
      
      await messagingService.sendMessage(
        {
          conversationId: selectedConversation.id,
          subject: messageSubject || 'Sans sujet',
          content: messageContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        },
        schoolId
      );

      // Clear form
      setMessageContent('');
      setMessageSubject('');
      setAttachments([]);

      // Reload messages
      loadMessages(selectedConversation.id);
      loadConversations();

      toast({
        title: 'Message envoyé',
        description: 'Votre message a été envoyé avec succès',
      });
    } catch (error) {
      console.error('[MESSAGING] Failed to send message:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer le message",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle file attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`flex flex-col bg-gray-50 ${embedded ? 'h-full' : 'h-screen'}`}>
      {/* Header - Hide in embedded mode */}
      {!embedded && (
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Messagerie Interne</h1>
                <p className="text-sm text-gray-500">
                  Communication sécurisée entre professeurs et administrateurs
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isConnected ? (
                <Badge variant="outline" className="border-green-500 text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Connecté
                </Badge>
              ) : wsError ? (
                <Badge variant="outline" className="border-red-500 text-red-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Erreur: {wsError}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-gray-500 text-gray-700">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Déconnecté
                </Badge>
              )}
              
              {unreadCount > 0 && (
                <Badge variant="default" className="px-3">
                  {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-96 bg-white border-r flex flex-col">
          <div className="p-4 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* New Conversation Button */}
            <NewConversationDialog
              schoolId={schoolId}
              currentUserId={user?.id ? String(user.id) : ''}
              onConversationCreated={loadConversations}
            />
          </div>

          <ScrollArea className="flex-1">
            {conversations
              .filter((conv) =>
                conv.participantName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
              )
              .map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(conversation.participantName)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {conversation.participantName || 'Utilisateur inconnu'}
                        </h3>
                        {conversation.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 mb-1">{conversation.participantRole}</p>

                      {conversation.lastMessagePreview && (
                        <p className="text-sm text-gray-700 truncate">{conversation.lastMessagePreview}</p>
                      )}

                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <Badge variant="default" className="mt-2 text-xs">
                          {conversation.unreadCount} nouveau{conversation.unreadCount > 1 ? 'x' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {conversations.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune conversation</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Messages Thread */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Conversation Header */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{getInitials(selectedConversation.participantName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{selectedConversation.participantName}</h2>
                  <p className="text-sm text-gray-500">{selectedConversation.participantRole}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isMine = message.senderId === String(user?.id);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isMine ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`rounded-lg p-4 ${
                            isMine ? 'bg-primary text-white' : 'bg-white border'
                          }`}
                        >
                          <div className="font-semibold text-sm mb-1">{message.subject}</div>
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                          {message.hasAttachments && message.attachments && (
                            <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                              {message.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Paperclip className="w-4 h-4" />
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadAttachment(att.id)}
                                    className="flex-1 truncate text-left hover:underline"
                                    title="Télécharger"
                                  >
                                    {att.filename}
                                  </button>
                                  <span className="text-xs">({att.fileSizeFormatted})</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-2 flex items-center justify-between text-xs opacity-70">
                            <span>
                              {formatDistanceToNow(new Date(message.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                            {isMine && (
                              <span>
                                {message.isRead ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Composer */}
            <div className="bg-white border-t p-4">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      <Paperclip className="w-3 h-3 mr-1" />
                      <span className="text-xs">
                        {file.name} ({formatFileSize(file.size)})
                      </span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  placeholder="Sujet (optionnel)"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <Textarea
                  placeholder="Écrivez votre message..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="flex-1 min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleSendMessage();
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" asChild>
                      <span className="cursor-pointer">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Joindre
                      </span>
                    </Button>
                  </label>
                </div>

                <Button onClick={handleSendMessage} disabled={loading || (!messageContent.trim() && attachments.length === 0)}>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer (Ctrl+Enter)
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Sélectionnez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
