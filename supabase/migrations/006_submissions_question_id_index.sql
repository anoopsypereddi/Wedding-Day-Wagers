-- ============================================================
-- Migration 006: Index on submissions.question_id
-- Wedding Wagers
-- ============================================================
-- get_leaderboard() and get_question_stats() both join submissions
-- on question_id. The composite UNIQUE index on (guest_id, question_id)
-- cannot be used efficiently for question_id-only filters, so without
-- this dedicated index those RPCs do a sequential scan on every call.
-- ============================================================

CREATE INDEX IF NOT EXISTS submissions_question_id_idx
    ON submissions (question_id);
