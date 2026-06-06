ALTER TABLE users RENAME COLUMN password TO password_hash;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE users
SET created_at = COALESCE(created_at, NOW());

ALTER TABLE users
    ALTER COLUMN created_at SET NOT NULL;

CREATE TABLE IF NOT EXISTS accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_accounts_user_type UNIQUE (user_id, type)
);

CREATE TABLE IF NOT EXISTS student_profiles (
    account_id BIGINT PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
    description TEXT,
    subjects TEXT,
    grade_level VARCHAR(255),
    format TEXT
);

CREATE TABLE IF NOT EXISTS tutor_profiles (
    account_id BIGINT PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
    description TEXT,
    subjects TEXT,
    experience TEXT,
    price NUMERIC(10, 2),
    education TEXT,
    achievements TEXT
);

INSERT INTO accounts (user_id, type, created_at)
SELECT id, role, created_at
FROM users
WHERE role IN ('STUDENT', 'TUTOR')
ON CONFLICT (user_id, type) DO NOTHING;

INSERT INTO student_profiles (account_id)
SELECT a.id
FROM accounts a
WHERE a.type = 'STUDENT'
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO tutor_profiles (account_id)
SELECT a.id
FROM accounts a
WHERE a.type = 'TUTOR'
ON CONFLICT (account_id) DO NOTHING;

ALTER TABLE users DROP COLUMN IF EXISTS role;
