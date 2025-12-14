-- Rollback for V2__messaging_performance_indexes.sql
--
-- Flyway Community doesn't run undo migrations automatically.
-- Keep this script as a manual rollback option.

DROP INDEX IF EXISTS public.idx_conversations_participants_not_deleted;
DROP INDEX IF EXISTS public.idx_messages_unread_recipient_created;
DROP INDEX IF EXISTS public.idx_messages_conv_created_not_deleted;
DROP INDEX IF EXISTS public.idx_messages_unread_conv_recipient_created;
