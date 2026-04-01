-- ============================================================
-- Migration 002: Row Level Security Policies
-- Pick Your Side of the Aisle - Wedding Gambling Game
-- ============================================================

-- ============================================================
-- questions
-- ============================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Anyone can read active questions
CREATE POLICY "questions_select_all"
    ON questions FOR SELECT
    USING (true);

-- Only authenticated users (admins) can create questions
CREATE POLICY "questions_insert_authenticated"
    ON questions FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Only authenticated users can update questions (e.g. set correct_answer_index)
CREATE POLICY "questions_update_authenticated"
    ON questions FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Only authenticated users can delete questions
CREATE POLICY "questions_delete_authenticated"
    ON questions FOR DELETE
    TO authenticated
    USING (true);

-- ============================================================
-- guests
-- ============================================================
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Anyone can register as a new guest
CREATE POLICY "guests_insert_all"
    ON guests FOR INSERT
    WITH CHECK (true);

-- Anyone can read all guests (needed to look up by name)
CREATE POLICY "guests_select_all"
    ON guests FOR SELECT
    USING (true);

-- Anyone can update any guest (for last_viewed_at)
CREATE POLICY "guests_update_all"
    ON guests FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- submissions
-- ============================================================
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a submission (guest submitting their answers)
CREATE POLICY "submissions_insert_all"
    ON submissions FOR INSERT
    WITH CHECK (true);

-- Anyone can update any submission (for changing answers)
CREATE POLICY "submissions_update_all"
    ON submissions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Anyone can read all submissions (needed to calculate stats)
CREATE POLICY "submissions_select_all"
    ON submissions FOR SELECT
    USING (true);
