CREATE TABLE IF NOT EXISTS tutor_reviews (
    id BIGSERIAL PRIMARY KEY,
    student_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    tutor_account_id BIGINT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text TEXT NOT NULL,
    tutor_reply TEXT,
    tutor_replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_tutor_reviews_student_tutor UNIQUE (student_account_id, tutor_account_id)
);

CREATE INDEX IF NOT EXISTS idx_tutor_reviews_student ON tutor_reviews (student_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_reviews_tutor ON tutor_reviews (tutor_account_id, created_at DESC);
