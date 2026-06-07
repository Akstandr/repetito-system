ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS public_profile BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_accounts_public_type ON accounts (public_profile, type);
