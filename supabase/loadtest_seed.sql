-- ============================================================
-- Load-test seed: synthetic guests + submissions
-- Wedding Wagers
-- ============================================================
-- Generates realistic data volume so EXPLAIN ANALYZE on the
-- RPCs reflects what the wedding will actually look like.
--
-- Usage (Supabase SQL editor or psql):
--   1. Run this script
--   2. EXPLAIN ANALYZE SELECT * FROM get_leaderboard();
--   3. EXPLAIN ANALYZE SELECT * FROM get_question_stats();
--   4. To clean up:
--        DELETE FROM guests WHERE name LIKE 'loadtest_%';
--      (submissions cascade)
-- ============================================================

-- 500 guests
INSERT INTO guests (name)
SELECT 'loadtest_' || i
FROM generate_series(1, 500) AS i;

-- One submission per (guest, active question) with a random option index.
-- Uses each question's actual option count so indices stay valid.
INSERT INTO submissions (guest_id, question_id, selected_option_index)
SELECT
    g.id,
    q.id,
    floor(random() * jsonb_array_length(q.options))::int
FROM   guests   g
CROSS  JOIN questions q
WHERE  g.name LIKE 'loadtest_%'
  AND  q.is_active = TRUE
  AND  q.locked_at IS NULL;
