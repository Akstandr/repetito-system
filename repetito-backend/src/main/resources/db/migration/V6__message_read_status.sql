ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

UPDATE messages
SET read_at = created_at
WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_conversation_read ON messages (conversation_id, read_at);
