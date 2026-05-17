import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Submission, QuestionStats } from '../types';

interface UseResultsOptions {
  pollMs?: number
}

interface UseResultsResult {
  stats: QuestionStats[];
  guestSubmissions: Submission[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

type StatsRow = {
  question_id: string
  option_counts: number[]
  total_responses: number
}

type RawSubmission = {
  id: string
  guest_id: string
  question_id: string
  selected_option_index: number
  created_at: string
}

/**
 * Aggregated answer stats (via the get_question_stats RPC, cheap) and,
 * optionally, the submissions belonging to a specific guest.
 *
 * Polls every `pollMs` (default 30s) so locked-card donuts stay current
 * as picks come in.
 */
export function useResults(
  guestId: string | null,
  options: UseResultsOptions = {},
): UseResultsResult {
  const { pollMs = 30000 } = options
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [guestSubmissions, setGuestSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firstLoadRef = useRef(true)

  const fetchResults = useCallback(async () => {
    try {
      const { data: statsData, error: statsError } = await supabase.rpc('get_question_stats')
      if (statsError) throw new Error(statsError.message)

      const rows = (statsData ?? []) as StatsRow[]
      const computed: QuestionStats[] = rows.map((r) => {
        const optionCounts = (r.option_counts ?? []).map((c) => Number(c))
        const totalResponses = Number(r.total_responses ?? 0)
        const percentages = optionCounts.map((count) =>
          totalResponses === 0 ? 0 : parseFloat(((count / totalResponses) * 100).toFixed(2)),
        )
        return { questionId: r.question_id, optionCounts, totalResponses, percentages }
      })

      setStats(computed)

      if (guestId) {
        const { data: guestData, error: guestError } = await supabase
          .from('submissions')
          .select('*')
          .eq('guest_id', guestId);

        if (guestError) throw new Error(guestError.message);

        const mapped: Submission[] = ((guestData ?? []) as RawSubmission[]).map((row) => ({
          id: row.id,
          guestId: row.guest_id,
          questionId: row.question_id,
          selectedOptionIndex: row.selected_option_index,
          createdAt: row.created_at,
        }))

        setGuestSubmissions(mapped);
      } else {
        setGuestSubmissions([]);
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch results'));
    } finally {
      if (firstLoadRef.current) {
        setLoading(false)
        firstLoadRef.current = false
      }
    }
  }, [guestId]);

  useEffect(() => {
    fetchResults();
    if (pollMs <= 0) return
    const id = setInterval(fetchResults, pollMs)
    return () => clearInterval(id)
  }, [fetchResults, pollMs]);

  return { stats, guestSubmissions, loading, error, refetch: fetchResults };
}
