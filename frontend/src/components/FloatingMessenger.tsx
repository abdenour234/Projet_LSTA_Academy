/**
 * FloatingMessenger - Facebook Messenger-style floating chat button
 * Appears on all pages for TEACHER and ADMIN users
 * Opens MessagingDashboard in a modal overlay
 */

import { useState, useEffect } from 'react';
import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import MessagingDashboard from '@/pages/MessagingDashboard';
import { Badge } from './ui/badge';
import messagingService from '@/lib/messagingApi';

export default function FloatingMessenger() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load unread count
  useEffect(() => {
    // Only fetch if user is TEACHER or ADMIN
    if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const count = await messagingService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('[FLOATING_MESSENGER] Failed to load unread count:', error);
      }
    };

    loadUnreadCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Only show for TEACHER and ADMIN
  if (!user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open messaging"
        >
          <div className="relative">
            {/* Main button */}
            <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110">
              <MessageCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            
            {/* Unread badge */}
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-[22px] bg-red-500 text-white text-xs font-bold rounded-full border-2 border-white shadow-md">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
            
            {/* Pulse animation for unread */}
            {unreadCount > 0 && (
              <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping" />
            )}
          </div>
        </button>
      )}

      {/* Messaging Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 md:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => !isMaximized && setIsOpen(false)}
          />
          
          {/* Modal Container */}
          <div 
            className={`relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl transition-all duration-300 flex flex-col ${
              isMaximized 
                ? 'w-full h-full md:w-full md:h-full' 
                : 'w-full h-[85vh] md:w-[450px] md:h-[650px]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-2xl md:rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <h2 className="font-semibold">Messagerie</h2>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Maximize/Minimize button (desktop only) */}
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="hidden md:flex p-2 hover:bg-blue-700/50 rounded-lg transition-colors"
                  aria-label={isMaximized ? "Minimize" : "Maximize"}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                
                {/* Close button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-blue-700/50 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messaging Content */}
            <div className="flex-1 overflow-hidden">
              <MessagingDashboard embedded />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
