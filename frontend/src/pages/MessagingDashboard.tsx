/**
 * MessagingDashboard - Enhanced UI for internal messaging
 * Features: Optimistic updates, typing indicators, better accessibility, modern design
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import messagingService, { Conversation, Message } from '@/lib/messagingApi';
import useMessagingWebSocket from '@/hooks/useMessagingWebSocket';
import useDebounce from '@/hooks/useDebounce';
import NewConversationDialog from '@/components/messaging/NewConversationDialog';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Paperclip, 
  Search, 
  X, 
  CheckCheck, 
  Check, 
  Clock,
  Download,
  Image as ImageIcon,
  FileText,
  Loader2,
  ChevronLeft,
  MoreVertical,
  Archive,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface MessagingDashboardProps {
  embedded?: boolean;
}

interface OptimisticMessage extends Message {
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string;
}

export default function MessagingDashboard({ embedded = false }: MessagingDashboardProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const schoolId = user?.schoolId ? parseInt(user.schoolId) : undefined;

  // Auto-scroll to bottom when new messages arrive [web:12]
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea [web:17]
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [messageContent]);

  // Guard: Cannot use messaging without schoolId
  if (!schoolId) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <MessageSquare className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">École non définie</h3>
          <p className="text-gray-600">Impossible d'accéder à la messagerie sans école assignée.</p>
        </div>
      </div>
    );
  }

  console.log('[MESSAGING] User context:', { userId: user?.id, schoolId, role: user?.role });

  const handleDownloadAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        const presigned = await messagingService.generateDownloadUrl(attachmentId, schoolId!);
        window.open(presigned.url, '_blank', 'noopener,noreferrer');
        
        toast({
          title: '✓ Téléchargement commencé',
          description: 'Le fichier va s\'ouvrir dans un nouvel onglet',
        });
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

  const loadUnreadCount = async () => {
    try {
      const count = await messagingService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

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
      setMessages(response.content || []);
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

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    setShowMobileConversations(false);
    
    if (conversation.unreadCount && conversation.unreadCount > 0) {
      setUnreadCount(prev => Math.max(0, prev - conversation.unreadCount!));
    }
    
    messagingService.markAllMessagesAsRead(conversation.id, schoolId);
  };

  function handleNewMessage(message: any) {
    setUnreadCount(prev => prev + 1);
    loadConversations();

    if (selectedConversation && message.conversationId === selectedConversation.id) {
      loadMessages(selectedConversation.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Enhanced notification [web:17]
    toast({
      title: '💬 Nouveau message',
      description: `${message.senderName || 'Utilisateur'}: ${message.preview}`,
      duration: 4000,
    });
  }

  function handleReadReceipt(receipt: any) {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === receipt.messageId
          ? { ...msg, isRead: true, readAt: receipt.readAt, readBy: receipt.readBy }
          : msg
      )
    );
  }

  // Optimistic UI: Show message immediately [web:14][web:18][web:21]
  const handleSendMessage = async () => {
    if (!selectedConversation || (!messageContent.trim() && attachments.length === 0)) {
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      tempId,
      conversationId: selectedConversation.id,
      senderId: String(user?.id),
      senderName: user?.fullName || user?.email || 'Utilisateur',
      recipientId: selectedConversation.participantId,
      recipientName: selectedConversation.participantName || '',
      subject: messageSubject || 'Sans sujet',
      content: messageContent,
      isRead: false,
      hasAttachments: attachments.length > 0,
      attachmentCount: attachments.length,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schoolId: schoolId!,
      status: 'sending',
    };

    // Add optimistic message immediately [web:14][web:21]
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear form
    const contentToSend = messageContent;
    const subjectToSend = messageSubject || 'Sans sujet';
    const attachmentsToSend = [...attachments];
    
    setMessageContent('');
    setMessageSubject('');
    setAttachments([]);
    scrollToBottom();

    try {
      setSending(true);
      
      console.log('[MESSAGING] Sending message:', { 
        conversationId: selectedConversation.id, 
        schoolId,
        hasAttachments: attachmentsToSend.length > 0 
      });
      
      const sentMessage = await messagingService.sendMessage(
        {
          conversationId: selectedConversation.id,
          subject: subjectToSend,
          content: contentToSend,
          attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
        },
        schoolId
      );

      // Replace optimistic message with real one [web:21]
      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...sentMessage, status: 'sent' } 
            : msg
        )
      );

      loadConversations();

      toast({
        title: '✓ Message envoyé',
        description: 'Votre message a été envoyé avec succès',
      });
    } catch (error) {
      console.error('[MESSAGING] Failed to send message:', error);
      
      // Mark message as failed [web:21]
      setMessages(prev =>
        prev.map(msg =>
          msg.tempId === tempId
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer le message. Réessayez.",
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate file size (20MB max) [web:17]
      const invalidFiles = files.filter(f => f.size > 20 * 1024 * 1024);
      if (invalidFiles.length > 0) {
        toast({
          title: 'Fichiers trop volumineux',
          description: `Maximum 20 MB par fichier`,
          variant: 'destructive',
        });
        return;
      }
      
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon based on type [web:17]
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  // Render message status indicator [web:17]
  const renderMessageStatus = (message: OptimisticMessage) => {
    const isMine = message.senderId === String(user?.id);
    if (!isMine) return null;

    if (message.status === 'sending') {
      return <Loader2 className="w-4 h-4 animate-spin" aria-label="Envoi en cours" />;
    }
    if (message.status === 'failed') {
      return <X className="w-4 h-4 text-red-400" aria-label="Échec de l'envoi" />;
    }
    if (message.isRead) {
      return <CheckCheck className="w-4 h-4" aria-label="Lu" />;
    }
    return <Check className="w-4 h-4" aria-label="Envoyé" />;
  };

  return (
    <div className={`flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 ${embedded ? 'h-full' : 'h-screen'}`}>
      {/* Enhanced Header [web:17] */}
      {!embedded && (
        <div className="bg-white border-b shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Messagerie Interne</h1>
                  <p className="text-sm text-gray-600">
                    Communication sécurisée · {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Connection Status with improved design [web:17] */}
                {isConnected ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-medium text-green-700">En ligne</span>
                  </div>
                ) : wsError ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-xs font-medium text-red-700">Erreur connexion</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">Connexion...</span>
                  </div>
                )}
                
                {unreadCount > 0 && (
                  <Badge className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                    {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List with improved styling [web:17] */}
        <div className={`${showMobileConversations ? 'flex' : 'hidden'} lg:flex w-full lg:w-96 bg-white border-r flex-col shadow-sm`}>
          <div className="p-4 space-y-3 border-b bg-gray-50">
            {/* Enhanced search input [web:17] */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher une conversation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
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
                  className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                    selectedConversation?.id === conversation.id 
                      ? 'bg-blue-50 border-l-4 border-l-blue-500 shadow-sm' 
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                          {getInitials(conversation.participantName)}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate text-gray-900">
                          {conversation.participantName || 'Utilisateur inconnu'}
                        </h3>
                        {conversation.lastMessageTime && (
                          <span className="text-xs text-gray-500 ml-2">
                            {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                              addSuffix: true,
                              locale: fr,
                            })}
                          </span>
                        )}
                      </div>

                      <Badge variant="secondary" className="text-xs mb-2">
                        {conversation.participantRole}
                      </Badge>

                      {conversation.lastMessagePreview && (
                        <p className={`text-sm truncate ${
                          conversation.unreadCount && conversation.unreadCount > 0 
                            ? 'text-gray-900 font-medium' 
                            : 'text-gray-600'
                        }`}>
                          {conversation.lastMessagePreview}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {conversations.length === 0 && !loading && (
              <div className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-600 font-medium mb-2">Aucune conversation</p>
                <p className="text-sm text-gray-500">Commencez par créer une nouvelle conversation</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Messages Thread with improved design [web:17] */}
        {selectedConversation ? (
          <div className={`${showMobileConversations ? 'hidden' : 'flex'} lg:flex flex-1 flex-col bg-white`}>
            {/* Enhanced Conversation Header [web:17] */}
            <div className="bg-white border-b px-6 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setShowMobileConversations(true)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <Avatar className="w-11 h-11 border-2 border-gray-100 shadow">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {getInitials(selectedConversation.participantName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedConversation.participantName}</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedConversation.participantRole}
                      </Badge>
                      {isTyping && (
                        <span className="text-xs text-gray-500 italic">est en train d'écrire...</span>
                      )}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Archive className="w-4 h-4 mr-2" />
                      Archiver
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages with improved bubble design [web:17] */}
            <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-gray-50 to-white">
              <div className="space-y-6" role="log" aria-live="polite" aria-label="Messages">
                {messages.map((message, index) => {
                  const isMine = message.senderId === String(user?.id);
                  const showDate = index === 0 || 
                    format(new Date(message.createdAt), 'yyyy-MM-dd') !== 
                    format(new Date(messages[index - 1].createdAt), 'yyyy-MM-dd');
                  
                  return (
                    <React.Fragment key={message.id}>
                      {/* Date separator [web:17] */}
                      {showDate && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-gray-100 px-4 py-1 rounded-full">
                            <span className="text-xs font-medium text-gray-600">
                              {format(new Date(message.createdAt), 'EEEE d MMMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      )}

                      <div
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      >
                        <div className={`max-w-[calc(100%-2rem)] sm:max-w-[75%] md:max-w-[65%] ${isMine ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`rounded-2xl p-4 shadow-sm ${
                              isMine 
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
                                : 'bg-white border border-gray-200 text-gray-900'
                            } ${message.status === 'failed' ? 'opacity-60 border-red-300' : ''}`}
                          >
                            {/* Subject header [web:17] */}
                            {message.subject && message.subject !== 'Sans sujet' && (
                              <div className={`font-semibold text-sm mb-2 pb-2 border-b ${
                                isMine ? 'border-white/20' : 'border-gray-200'
                              }`}>
                                {message.subject}
                              </div>
                            )}
                            
                            {/* Message content */}
                            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.content}
                            </div>

                            {/* Attachments with improved design [web:17] */}
                            {message.hasAttachments && message.attachments && message.attachments.length > 0 && (
                              <div className={`mt-3 pt-3 border-t ${
                                isMine ? 'border-white/20' : 'border-gray-200'
                              } space-y-2`}>
                                {message.attachments.map((att) => (
                                  <button
                                    key={att.id}
                                    type="button"
                                    onClick={() => handleDownloadAttachment(att.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                      isMine 
                                        ? 'bg-white/10 hover:bg-white/20' 
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className={`p-2 rounded ${isMine ? 'bg-white/20' : 'bg-blue-100'}`}>
                                      {getFileIcon(att.filename)}
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                      <div className="text-sm font-medium truncate">{att.filename}</div>
                                      <div className="text-xs opacity-75">{att.fileSizeFormatted}</div>
                                    </div>
                                    <Download className="w-4 h-4 flex-shrink-0" />
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Enhanced message footer [web:17] */}
                            <div className={`mt-2 flex items-center justify-between text-xs ${
                              isMine ? 'text-white/70' : 'text-gray-500'
                            }`}>
                              <span>
                                {format(new Date(message.createdAt), 'HH:mm', { locale: fr })}
                              </span>
                              {renderMessageStatus(message)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Enhanced Message Composer [web:17] */}
            <div className="bg-white border-t p-4 shadow-lg">
              {/* Attachments Preview with improved design */}
              {attachments.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {attachments.length} pièce{attachments.length > 1 ? 's' : ''} jointe{attachments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm"
                      >
                        <div className="p-1 bg-blue-50 rounded">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate max-w-[150px]">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-red-50 rounded-full transition-colors"
                          aria-label="Supprimer"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subject input with better styling */}
              <div className="mb-3">
                <Input
                  placeholder="Sujet du message (optionnel)"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Message input area with improved layout [web:17] */}
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Écrivez votre message... (Ctrl+Entrée pour envoyer)"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="min-h-[60px] max-h-[120px] resize-none border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey && !sending) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    aria-label="Message content"
                  />
                </div>
              </div>

              {/* Action buttons with improved design [web:17] */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm" asChild className="cursor-pointer">
                      <span>
                        <Paperclip className="w-4 h-4 mr-2" />
                        Joindre un fichier
                      </span>
                    </Button>
                  </label>
                </div>

                <Button 
                  onClick={handleSendMessage} 
                  disabled={sending || loading || (!messageContent.trim() && attachments.length === 0)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty state with improved design [web:17] */
          <div className="flex-1 hidden lg:flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center p-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-lg">
                <MessageSquare className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sélectionnez une conversation</h3>
              <p className="text-gray-600 mb-4">Choisissez une conversation dans la liste pour commencer à échanger</p>
              <NewConversationDialog
                schoolId={schoolId}
                currentUserId={user?.id ? String(user.id) : ''}
                onConversationCreated={loadConversations}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
