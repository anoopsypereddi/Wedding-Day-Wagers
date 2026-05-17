-- ============================================================
-- Migration 005: Question Stats RPC
-- Wedding Wagers
-- ============================================================
-- Aggregates submission counts per question option server-side.
-- Replaces a hot path where every guest pulled every submission
-- row and bucketed in JS.
--
-- Returns one row per active question with option_counts indexed
-- by selected_option_index.
-- ============================================================

CREATE OR REPLACE FUNCTION get_question_stats()
RETURNS TABLE (
  question_id     UUID,
  option_counts   BIGINT[],
  total_responses BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH options AS (
    SELECT
      q.id AS qid,
      generate_series(0, jsonb_array_length(q.options) - 1) AS opt_idx
    FROM   questions q
    WHERE  q.is_active = TRUE
  ),
  counted AS (
    SELECT
      o.qid,
      o.opt_idx,
      COUNT(s.id) AS cnt
    FROM   options o
    LEFT JOIN submissions s
      ON   s.question_id = o.qid
      AND  s.selected_option_index = o.opt_idx
    GROUP BY o.qid, o.opt_idx
  )
  SELECT
    qid AS question_id,
    array_agg(cnt ORDER BY opt_idx) AS option_counts,
    SUM(cnt)                        AS total_responses
  FROM   counted
  GROUP  BY qid;
$$;

GRANT EXECUTE ON FUNCTION get_question_stats() TO anon, authenticated;
