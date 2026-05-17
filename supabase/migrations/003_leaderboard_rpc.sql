-- ============================================================
-- Migration 003: Leaderboard RPC
-- Pick Your Side of the Aisle - Wedding Gambling Game
-- ============================================================
-- Computes ranked leaderboard scores server-side so the client
-- does not need to fetch all three tables and aggregate in JS.
-- Returns one row per guest who has at least one submission,
-- only scoring against questions that have been answered
-- (correct_answer_index IS NOT NULL).
-- ============================================================

CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  rank        BIGINT,
  guest_id    UUID,
  guest_name  TEXT,
  correct     BIGINT,
  total       BIGINT,
  percentage  INTEGER
)
LANGUAGE sql
STABLE
AS $$
  WITH answered_questions AS (
    SELECT id, correct_answer_index
    FROM   questions
    WHERE  is_active = TRUE
      AND  correct_answer_index IS NOT NULL
  ),
  answered_total AS (
    SELECT COUNT(*) AS cnt FROM answered_questions
  ),
  guest_scores AS (
    SELECT
      g.id   AS guest_id,
      g.name AS guest_name,
      COUNT(CASE WHEN s.selected_option_index = aq.correct_answer_index THEN 1 END) AS correct,
      (SELECT cnt FROM answered_total)::BIGINT AS total
    FROM   guests g
    JOIN   submissions s        ON s.guest_id    = g.id
    JOIN   answered_questions aq ON aq.id         = s.question_id
    GROUP  BY g.id, g.name
  )
  SELECT
    RANK() OVER (ORDER BY correct DESC, guest_name ASC)::BIGINT AS rank,
    guest_id,
    guest_name,
    correct,
    total,
    CASE WHEN total > 0
         THEN ROUND((correct::NUMERIC / total) * 100)::INTEGER
         ELSE 0
    END AS percentage
  FROM  guest_scores
  ORDER BY rank, guest_name;
$$;

-- Grant execute to both anon (guests) and authenticated (admin)
GRANT EXECUTE ON FUNCTION get_leaderboard() TO anon, authenticated;
