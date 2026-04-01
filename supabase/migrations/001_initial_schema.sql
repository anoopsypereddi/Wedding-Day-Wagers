-- ============================================================
-- Migration 001: Initial Schema
-- Pick Your Side of the Aisle - Wedding Gambling Game
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: questions
-- Stores each trivia/prediction question shown to guests
-- ============================================================
CREATE TABLE questions (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    text                 TEXT        NOT NULL,
    options              JSONB       NOT NULL,           -- Array of option strings, e.g. ["Yes", "No", "Maybe"]
    category             TEXT,                           -- Optional grouping label
    correct_answer_index INTEGER,                        -- Set after the event to reveal the winner
    display_order        INTEGER     NOT NULL DEFAULT 0, -- Controls ordering on the front end
    is_active            BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  questions                      IS 'Prediction/trivia questions presented to wedding guests.';
COMMENT ON COLUMN questions.options              IS 'JSONB array of answer option strings.';
COMMENT ON COLUMN questions.correct_answer_index IS 'Zero-based index into options; NULL until the answer is revealed.';

-- ============================================================
-- Table: guests
-- One row per unique guest who participates
-- ============================================================
CREATE TABLE guests (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name           TEXT        NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_viewed_at TIMESTAMPTZ                           -- Updated each time the guest views their answers
);

-- Case-insensitive unique name so "Alice" and "alice" are treated as the same person
CREATE UNIQUE INDEX guests_name_ci_idx ON guests (LOWER(name));

COMMENT ON TABLE  guests               IS 'Wedding guests who have submitted predictions.';
COMMENT ON COLUMN guests.name          IS 'Display name; uniqueness is enforced case-insensitively.';
COMMENT ON COLUMN guests.last_viewed_at IS 'Timestamp of the most recent time the guest viewed results.';

-- ============================================================
-- Table: submissions
-- Records each guest's answer to each question (one per pair)
-- ============================================================
CREATE TABLE submissions (
    id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id              UUID        NOT NULL REFERENCES guests(id)    ON DELETE CASCADE,
    question_id           UUID        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_index INTEGER     NOT NULL, -- Zero-based index into questions.options
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A guest may only answer each question once
    CONSTRAINT submissions_guest_question_unique UNIQUE (guest_id, question_id)
);

COMMENT ON TABLE  submissions                       IS 'Each guest''s selected answer for a given question.';
COMMENT ON COLUMN submissions.selected_option_index IS 'Zero-based index into the parent question''s options array.';
