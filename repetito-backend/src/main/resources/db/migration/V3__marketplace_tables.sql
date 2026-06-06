CREATE TABLE IF NOT EXISTS tutor_cards (
    id BIGSERIAL PRIMARY KEY,
    tutor_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(255) NOT NULL,
    price_per_lesson NUMERIC(10, 2) NOT NULL,
    format VARCHAR(16) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutor_card_supported_grades (
    tutor_card_id BIGINT NOT NULL REFERENCES tutor_cards (id) ON DELETE CASCADE,
    grade INTEGER NOT NULL,
    PRIMARY KEY (tutor_card_id, grade)
);

CREATE INDEX IF NOT EXISTS idx_tutor_cards_active_subject ON tutor_cards (is_active, subject);
CREATE INDEX IF NOT EXISTS idx_tutor_cards_tutor_account ON tutor_cards (tutor_account_id);

CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    tutor_card_id BIGINT NOT NULL REFERENCES tutor_cards (id) ON DELETE CASCADE,
    student_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    tutor_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_student ON applications (student_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_tutor ON applications (tutor_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_card ON applications (tutor_card_id);

CREATE TABLE IF NOT EXISTS conversations (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL UNIQUE REFERENCES applications (id) ON DELETE CASCADE,
    student_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    tutor_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_student ON conversations (student_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_tutor ON conversations (tutor_account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages (conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS lessons (
    id BIGSERIAL PRIMARY KEY,
    tutor_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    student_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    application_id BIGINT NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    start_date_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_student ON lessons (student_account_id, start_date_time DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_tutor ON lessons (tutor_account_id, start_date_time DESC);
CREATE INDEX IF NOT EXISTS idx_lessons_application ON lessons (application_id);
