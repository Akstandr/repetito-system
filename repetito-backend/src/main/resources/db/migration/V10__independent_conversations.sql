ALTER TABLE conversations
    ALTER COLUMN application_id DROP NOT NULL,
    ALTER COLUMN student_account_id DROP NOT NULL,
    ALTER COLUMN tutor_account_id DROP NOT NULL;

ALTER TABLE conversations
    ADD COLUMN participant_a_user_id BIGINT REFERENCES users (id) ON DELETE CASCADE,
    ADD COLUMN participant_a_account_id BIGINT REFERENCES accounts (id) ON DELETE CASCADE,
    ADD COLUMN participant_a_type VARCHAR(16),
    ADD COLUMN participant_b_user_id BIGINT REFERENCES users (id) ON DELETE CASCADE,
    ADD COLUMN participant_b_account_id BIGINT REFERENCES accounts (id) ON DELETE CASCADE,
    ADD COLUMN participant_b_type VARCHAR(16),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE conversations conversation
SET participant_a_user_id = student.user_id,
    participant_a_account_id = conversation.student_account_id,
    participant_a_type = 'STUDENT',
    participant_b_user_id = tutor.user_id,
    participant_b_account_id = conversation.tutor_account_id,
    participant_b_type = 'TUTOR',
    updated_at = conversation.created_at
FROM accounts student, accounts tutor
WHERE student.id = conversation.student_account_id
  AND tutor.id = conversation.tutor_account_id;

ALTER TABLE conversations
    ALTER COLUMN participant_a_user_id SET NOT NULL,
    ALTER COLUMN participant_a_type SET NOT NULL,
    ALTER COLUMN participant_b_user_id SET NOT NULL,
    ALTER COLUMN participant_b_type SET NOT NULL;

CREATE INDEX idx_conversations_participant_a_user ON conversations (participant_a_user_id, updated_at DESC);
CREATE INDEX idx_conversations_participant_b_user ON conversations (participant_b_user_id, updated_at DESC);

ALTER TABLE messages
    ALTER COLUMN sender_account_id DROP NOT NULL,
    ADD COLUMN sender_user_id BIGINT REFERENCES users (id) ON DELETE CASCADE,
    ADD COLUMN sender_type VARCHAR(16);

UPDATE messages message
SET sender_user_id = account.user_id,
    sender_type = account.type
FROM accounts account
WHERE account.id = message.sender_account_id;

ALTER TABLE messages
    ALTER COLUMN sender_user_id SET NOT NULL,
    ALTER COLUMN sender_type SET NOT NULL;

CREATE INDEX idx_messages_sender_user ON messages (sender_user_id);
