/**
 * MessagingDashboard - Enhanced UI for internal messaging
 * Optimized for both modal and full-page views with better responsive design
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
  Download,
  Image as ImageIcon,
  FileText,
  Loader2,
  ChevronLeft,
  MoreVertical,
  Archive,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MessagingDashboardProps {
  embedded?: boolean;
  className?: string;
}

interface OptimisticMessage extends Message {
  status?: 'sending' | 'sent' | 'failed';
  tempId?: string;
}

export default function MessagingDashboard({ embedded = false, className }: MessagingDashboardProps) {
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
  const [showMobileConversations, setShowMobileConversations] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const schoolId = user?.schoolId ? parseInt(user.schoolId) : undefined;

  // Auto-scroll to bottom [web:12]
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Auto-resize textarea [web:17]
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [messageContent]);

  // Guard: Cannot use messaging without schoolId
  if (!schoolId) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">École non définie</h3>
          <p className="text-sm text-gray-600">Impossible d'accéder à la messagerie sans école assignée.</p>
        </div>
      </div>
    );
  }

  const handleDownloadAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        const presigned = await messagingService.generateDownloadUrl(attachmentId, schoolId!);
        
        // ✅ Convert relative URLs to absolute URLs if needed
        let downloadUrl = presigned.url;
        if (downloadUrl.startsWith('/api/')) {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
          downloadUrl = `${API_URL.replace('/api', '')}${downloadUrl}`;
        }
        
        console.log('[MESSAGING] Opening download URL:', downloadUrl);
        window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        
        toast({
          title: '✓ Téléchargement',
          description: 'Le fichier s\'ouvre dans un nouvel onglet',
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

  const { isConnected, error: wsError } = useMessagingWebSocket({
    userId: user?.id ? String(user.id) : '',
    onNewMessage: handleNewMessage,
    onReadReceipt: handleReadReceipt,
    autoConnect: true,
  });

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  const loadConversations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await messagingService.getConversations(0, 50);
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
      const response = await messagingService.getConversationMessages(
        conversationId,
        schoolId,
        0,
        100
      );
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
      senderName: user?.fullName || user?.email || 'Vous',
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

    setMessages(prev => [...prev, optimisticMessage]);
    
    const contentToSend = messageContent;
    const subjectToSend = messageSubject || 'Sans sujet';
    const attachmentsToSend = [...attachments];
    
    setMessageContent('');
    setMessageSubject('');
    setAttachments([]);

    try {
      setSending(true);
      
      const sentMessage = await messagingService.sendMessage(
        {
          conversationId: selectedConversation.id,
          subject: subjectToSend,
          content: contentToSend.trim() || '📎 Fichier(s) joint(s)',
          attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
        },
        schoolId
      );

      setMessages(prev => 
        prev.map(msg => 
          msg.tempId === tempId 
            ? { ...sentMessage, status: 'sent' } 
            : msg
        )
      );

      loadConversations();

      toast({
        title: '✓ Envoyé',
        description: 'Message envoyé avec succès',
      });
    } catch (error) {
      console.error('[MESSAGING] Failed to send message:', error);
      
      setMessages(prev =>
        prev.map(msg =>
          msg.tempId === tempId
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer le message",
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
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

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const renderMessageStatus = (message: OptimisticMessage) => {
    const isMine = message.senderId === String(user?.id);
    if (!isMine) return null;

    if (message.status === 'sending') {
      return <Loader2 className="w-3 h-3 animate-spin" aria-label="Envoi en cours" />;
    }
    if (message.status === 'failed') {
      return <X className="w-3 h-3 text-red-400" aria-label="Échec" />;
    }
    if (message.isRead) {
      return <CheckCheck className="w-3 h-3" aria-label="Lu" />;
    }
    return <Check className="w-3 h-3" aria-label="Envoyé" />;
  };

  // Format time intelligently [web:17]
  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return `Hier ${format(date, 'HH:mm')}`;
    }
    return format(date, 'd MMM HH:mm', { locale: fr });
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.participantName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div className={cn(
      "flex flex-col bg-white",
      embedded ? "h-full" : "h-screen",
      className
    )}>
      {/* Compact Header for Modal View [web:17] */}
      {!embedded && (
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              <div>
                <h2 className="text-lg font-bold">Messagerie</h2>
                <p className="text-xs text-blue-100">
                  {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isConnected ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs font-medium">En ligne</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white/20 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">Connexion...</span>
                </div>
              )}
              
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white border-0 px-2 py-0.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Conversations List [web:17] */}
        <div className={cn(
          "flex flex-col border-r bg-gray-50",
          showMobileConversations ? "flex w-full" : "hidden",
          "md:flex md:w-80 lg:w-96"
        )}>
          {/* Search & New Conversation */}
          <div className="flex-shrink-0 p-3 space-y-2 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm border-gray-300 focus-visible:ring-1"
              />
            </div>
            
            <NewConversationDialog
              schoolId={schoolId}
              currentUserId={user?.id ? String(user.id) : ''}
              onConversationCreated={loadConversations}
            />
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {filteredConversations.length > 0 ? (
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={cn(
                      "w-full p-3 text-left transition-colors hover:bg-white",
                      selectedConversation?.id === conversation.id 
                        ? "bg-blue-50 border-l-3 border-l-blue-600" 
                        : "bg-gray-50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                            {getInitials(conversation.participantName)}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unreadCount && conversation.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow ring-2 ring-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm text-gray-900 truncate">
                            {conversation.participantName || 'Utilisateur'}
                          </h3>
                          {conversation.lastMessageTime && (
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatDistanceToNow(new Date(conversation.lastMessageTime), {
                                addSuffix: true,
                                locale: fr,
                              }).replace('environ ', '')}
                            </span>
                          )}
                        </div>

                        <Badge variant="secondary" className="text-xs mb-1.5 font-normal">
                          {conversation.participantRole}
                        </Badge>

                        {conversation.lastMessagePreview && (
                          <p className={cn(
                            "text-xs truncate",
                            conversation.unreadCount && conversation.unreadCount > 0 
                              ? "text-gray-900 font-medium" 
                              : "text-gray-600"
                          )}>
                            {conversation.lastMessagePreview}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 font-medium mb-1">Aucune conversation</p>
                <p className="text-xs text-gray-500">Créez une nouvelle conversation</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Messages Thread [web:17] */}
        {selectedConversation ? (
          <div className={cn(
            "flex flex-col flex-1 bg-white min-w-0",
            showMobileConversations ? "hidden" : "flex",
            "md:flex"
          )}>
            {/* Conversation Header */}
            <div className="flex-shrink-0 bg-white border-b px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden p-1 h-auto"
                    onClick={() => setShowMobileConversations(true)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <Avatar className="w-9 h-9 border-2 border-gray-100 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                      {getInitials(selectedConversation.participantName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-sm text-gray-900 truncate">
                      {selectedConversation.participantName}
                    </h2>
                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                      {selectedConversation.participantRole}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1 h-auto flex-shrink-0">
                      <MoreVertical className="w-4 h-4" />
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

            {/* Messages [web:17] */}
            <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-gray-50/50 to-white">
              <div className="space-y-4 max-w-4xl mx-auto" role="log" aria-live="polite">
                {messages.map((message, index) => {
                  const isMine = message.senderId === String(user?.id);
                  const showDate = index === 0 || 
                    format(new Date(message.createdAt), 'yyyy-MM-dd') !== 
                    format(new Date(messages[index - 1].createdAt), 'yyyy-MM-dd');
                  
                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-6">
                          <div className="bg-gray-100 px-3 py-1 rounded-full shadow-sm">
                            <span className="text-xs font-medium text-gray-600">
                              {format(new Date(message.createdAt), 'EEEE d MMMM', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[85%] sm:max-w-[75%] md:max-w-[65%]",
                          "animate-in fade-in slide-in-from-bottom-2 duration-200"
                        )}>
                          <div
                            className={cn(
                              "rounded-2xl px-3 py-2 shadow-sm",
                              isMine 
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white" 
                                : "bg-white border border-gray-200 text-gray-900",
                              message.status === 'failed' && "opacity-60 border-red-300"
                            )}
                          >
                            {message.subject && message.subject !== 'Sans sujet' && (
                              <div className={cn(
                                "font-semibold text-xs mb-1.5 pb-1.5 border-b",
                                isMine ? "border-white/20" : "border-gray-200"
                              )}>
                                {message.subject}
                              </div>
                            )}
                            
                            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.content}
                            </div>

                            {message.hasAttachments && message.attachments && message.attachments.length > 0 && (
                              <div className={cn(
                                "mt-2 pt-2 border-t space-y-1.5",
                                isMine ? "border-white/20" : "border-gray-200"
                              )}>
                                {message.attachments.map((att) => (
                                  <button
                                    key={att.id}
                                    type="button"
                                    onClick={() => handleDownloadAttachment(att.id)}
                                    className={cn(
                                      "w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left",
                                      isMine 
                                        ? "bg-white/10 hover:bg-white/20" 
                                        : "bg-gray-50 hover:bg-gray-100"
                                    )}
                                  >
                                    <div className={cn(
                                      "p-1.5 rounded",
                                      isMine ? "bg-white/20" : "bg-blue-100"
                                    )}>
                                      {getFileIcon(att.filename)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate">{att.filename}</div>
                                      <div className="text-xs opacity-75">{att.fileSizeFormatted}</div>
                                    </div>
                                    <Download className="w-3.5 h-3.5 flex-shrink-0 opacity-75" />
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className={cn(
                              "mt-1.5 flex items-center justify-between gap-2 text-xs",
                              isMine ? "text-white/70" : "text-gray-500"
                            )}>
                              <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
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

            {/* Message Composer [web:17] */}
            <div className="flex-shrink-0 bg-white border-t p-3 shadow-lg">
              {attachments.length > 0 && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg border">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 bg-white px-2 py-1.5 rounded border text-xs"
                      >
                        <div className="p-1 bg-blue-50 rounded">
                          {getFileIcon(file.name)}
                        </div>
                        <div className="flex-1 min-w-0 max-w-[120px]">
                          <div className="font-medium text-gray-900 truncate">{file.name}</div>
                          <div className="text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                        <button
                          onClick={() => removeAttachment(index)}
                          className="p-0.5 hover:bg-red-50 rounded"
                        >
                          <X className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Input
                  placeholder="Sujet (optionnel)"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="h-8 text-sm"
                />

                <div className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Votre message... (Ctrl+Entrée)"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="min-h-[60px] max-h-[100px] resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey && !sending) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.zip"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" asChild className="cursor-pointer h-8 text-xs">
                        <span>
                          <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                          Joindre
                        </span>
                      </Button>
                    </label>
                  </div>

                  <Button 
                    onClick={handleSendMessage} 
                    disabled={sending || loading || (!messageContent.trim() && attachments.length === 0)}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 h-8 text-xs shadow"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-1.5" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center p-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow">
                <MessageSquare className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Sélectionnez une conversation</h3>
              <p className="text-sm text-gray-600 mb-4">Choisissez une conversation pour commencer</p>
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
