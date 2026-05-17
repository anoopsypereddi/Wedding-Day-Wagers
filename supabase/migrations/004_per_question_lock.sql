-- ============================================================
-- Migration 004: Per-Question Lock
-- Wedding Wagers
-- ============================================================
-- Replaces the single global game lock with a per-question
-- lifecycle: open  -> locked -> scored.
--
--   open    locked_at IS NULL
--   locked  locked_at IS NOT NULL AND correct_answer_index IS NULL
--   scored  correct_answer_index IS NOT NULL  (locked_at is also set)
-- ============================================================

-- ------------------------------------------------------------
-- Add per-question lock timestamp
-- ------------------------------------------------------------
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

COMMENT ON COLUMN questions.locked_at IS
    'When this question was locked. NULL = still accepting picks.';

-- ------------------------------------------------------------
-- Revealing the correct answer implicitly locks the question
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION questions_lock_on_reveal()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.correct_answer_index IS NOT NULL AND NEW.locked_at IS NULL THEN
        NEW.locked_at := NOW();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS questions_lock_on_reveal_trigger ON questions;
CREATE TRIGGER questions_lock_on_reveal_trigger
    BEFORE INSERT OR UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION questions_lock_on_reveal();

-- ------------------------------------------------------------
-- Reject submission writes against locked questions
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION submissions_reject_if_locked()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    is_locked BOOLEAN;
BEGIN
    SELECT locked_at IS NOT NULL
      INTO is_locked
      FROM questions
     WHERE id = NEW.question_id;

    IF is_locked THEN
        RAISE EXCEPTION 'Question % is locked; submissions cannot be modified.', NEW.question_id
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS submissions_reject_if_locked_trigger ON submissions;
CREATE TRIGGER submissions_reject_if_locked_trigger
    BEFORE INSERT OR UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION submissions_reject_if_locked();

-- ------------------------------------------------------------
-- Drop the now-unused global game_settings table
-- ------------------------------------------------------------
DROP TABLE IF EXISTS game_settings;
