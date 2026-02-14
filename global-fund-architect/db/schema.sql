-- PostgreSQL schema for users and projects
-- Supports email/password signup and multiple projects per user.

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_email_format_chk CHECK (position('@' in email) > 1)
);

-- Case-insensitive uniqueness for emails.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx
    ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT projects_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT projects_status_chk
        CHECK (status IN ('active', 'archived'))
);

-- Indexes to optimize common access patterns.
CREATE INDEX IF NOT EXISTS projects_user_id_idx
    ON projects (user_id);

CREATE INDEX IF NOT EXISTS projects_user_status_idx
    ON projects (user_id, status);

COMMIT;
