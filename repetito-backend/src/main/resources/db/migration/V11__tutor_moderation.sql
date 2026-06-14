CREATE TABLE tutor_account_applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL,
    price_per_lesson NUMERIC(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT,
    reviewed_by_admin_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tutor_account_application_subjects (
    application_id BIGINT NOT NULL REFERENCES tutor_account_applications (id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    PRIMARY KEY (application_id, subject)
);

CREATE UNIQUE INDEX uq_tutor_account_application_pending
    ON tutor_account_applications (user_id) WHERE status = 'PENDING';
CREATE INDEX idx_tutor_account_applications_status_created
    ON tutor_account_applications (status, created_at DESC);

ALTER TABLE tutor_cards ADD COLUMN moderation_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE tutor_cards ADD COLUMN rejection_reason TEXT;
ALTER TABLE tutor_cards ADD COLUMN reviewed_by_admin_id BIGINT REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE tutor_cards ADD COLUMN reviewed_at TIMESTAMPTZ;
CREATE INDEX idx_tutor_cards_moderation ON tutor_cards (moderation_status, created_at DESC);

UPDATE tutor_cards SET moderation_status = 'APPROVED' WHERE moderation_status IS NULL;
