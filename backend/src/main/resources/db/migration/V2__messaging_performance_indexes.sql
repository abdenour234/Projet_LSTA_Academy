-- ============================================
-- Messaging performance indexes (Phase 3)
-- Date: 2025-12-14
--
-- Notes:
-- - Existing schema already has general messaging indexes.
-- - These add targeted PARTIAL indexes for the most common hot paths:
--   unread checks, conversation timeline reads, and soft-delete filtering.
-- ============================================

-- Unread messages per conversation + recipient (used by unread counters / mark-as-read flows)
CREATE INDEX IF NOT EXISTS idx_messages_unread_conv_recipient_created
  ON public.messages (conversation_id, recipient_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_read = FALSE;

-- Conversation message timeline reads (only non-deleted messages)
CREATE INDEX IF NOT EXISTS idx_messages_conv_created_not_deleted
  ON public.messages (conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Unread messages per recipient (used by inbox unread badge)
CREATE INDEX IF NOT EXISTS idx_messages_unread_recipient_created
  ON public.messages (recipient_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_read = FALSE;

-- Conversation lookup should ignore soft-deleted conversations
CREATE INDEX IF NOT EXISTS idx_conversations_participants_not_deleted
  ON public.conversations (participant1_id, participant2_id)
  WHERE deleted_at IS NULL;
