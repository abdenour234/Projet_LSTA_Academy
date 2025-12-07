/**
 * Custom React hook for WebSocket messaging notifications
 * Uses STOMP over WebSocket with SockJS fallback
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface WebSocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  subject: string;
  preview: string;
  hasAttachments: boolean;
  createdAt: string;
}

export interface ReadReceipt {
  messageId: string;
  readBy: string;
  readAt: string;
}

interface UseMessagingWebSocketOptions {
  userId: string;
  onNewMessage?: (message: WebSocketMessage) => void;
  onReadReceipt?: (receipt: ReadReceipt) => void;
  autoConnect?: boolean;
}

export function useMessagingWebSocket({
  userId,
  onNewMessage,
  onReadReceipt,
  autoConnect = true,
}: UseMessagingWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const clientRef = useRef<Client | null>(null);
  const messageSubRef = useRef<StompSubscription | null>(null);
  const receiptSubRef = useRef<StompSubscription | null>(null);

  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Create STOMP client with SockJS
      const client = new Client({
        webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL}/ws`),
        
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },

        debug: (str) => {
          console.log('[STOMP]', str);
        },

        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        onConnect: () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          setError(null);

          // Subscribe to personal message notifications
          if (userId) {
            messageSubRef.current = client.subscribe(
              `/topic/messages/${userId}`,
              (message) => {
                try {
                  const data = JSON.parse(message.body) as WebSocketMessage;
                  console.log('📨 New message received:', data);
                  onNewMessage?.(data);
                } catch (err) {
                  console.error('Failed to parse message:', err);
                }
              }
            );

            // Subscribe to read receipts
            receiptSubRef.current = client.subscribe(
              `/topic/read-receipts/${userId}`,
              (message) => {
                try {
                  const data = JSON.parse(message.body) as ReadReceipt;
                  console.log('✅ Read receipt received:', data);
                  onReadReceipt?.(data);
                } catch (err) {
                  console.error('Failed to parse read receipt:', err);
                }
              }
            );
          }
        },

        onStompError: (frame) => {
          console.error('❌ STOMP error:', frame.headers['message']);
          console.error('Details:', frame.body);
          setError(frame.headers['message'] || 'WebSocket error');
          setIsConnected(false);
        },

        onWebSocketClose: () => {
          console.log('🔌 WebSocket connection closed');
          setIsConnected(false);
        },

        onWebSocketError: (event) => {
          console.error('❌ WebSocket error:', event);
          setError('WebSocket connection error');
          setIsConnected(false);
        },
      });

      client.activate();
      clientRef.current = client;

    } catch (err) {
      console.error('Failed to initialize WebSocket:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [userId, onNewMessage, onReadReceipt]);

  const disconnect = useCallback(() => {
    if (messageSubRef.current) {
      messageSubRef.current.unsubscribe();
      messageSubRef.current = null;
    }

    if (receiptSubRef.current) {
      receiptSubRef.current.unsubscribe();
      receiptSubRef.current = null;
    }

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    setIsConnected(false);
    console.log('🔌 WebSocket disconnected');
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => connect(), 1000);
  }, [connect, disconnect]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, userId, connect, disconnect]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    reconnect,
  };
}

export default useMessagingWebSocket;
