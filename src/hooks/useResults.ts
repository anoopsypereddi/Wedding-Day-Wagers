import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Question, Submission, QuestionStats } from '../types';

interface UseResultsResult {
  stats: QuestionStats[];
  guestSubmissions: Submission[];
  loading: boolean;
  error: Error | null;
}

/**
 * Fetches aggregated response statistics for every question and,
 * optionally, the submissions belonging to a specific guest.
 *
 * Pass `null` as guestId to skip the per-guest fetch.
 *
 * @example
 * const { stats, guestSubmissions, loading, error } = useResults(guest.id);
 */
export function useResults(guestId: string | null): UseResultsResult {
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [guestSubmissions, setGuestSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all questions so we know how many options each one has.
      // id and options column names are the same in snake_case and camelCase.
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('id, options')
        .eq('is_active', true);

      if (questionError) throw new Error(questionError.message);

      const questions = (questionData ?? []) as Pick<Question, 'id' | 'options'>[];

      // Fetch all submission rows (only the two columns we need)
      const { data: aggData, error: aggError } = await supabase
        .from('submissions')
        .select('question_id, selected_option_index');

      if (aggError) throw new Error(aggError.message);

      // aggData rows use snake_case DB column names
      type RawSubmissionRow = { question_id: string; selected_option_index: number };
      const allRows = (aggData ?? []) as RawSubmissionRow[];

      // Pre-fill counts with zeros for every option on every question
      const countMap = new Map<string, number[]>();
      for (const { id, options } of questions) {
        countMap.set(id, new Array<number>(options.length).fill(0));
      }

      for (const { question_id, selected_option_index } of allRows) {
        const counts = countMap.get(question_id);
        if (counts && selected_option_index >= 0 && selected_option_index < counts.length) {
          counts[selected_option_index]++;
        }
      }

      // Derive QuestionStats for every active question
      const computed: QuestionStats[] = questions.map(({ id }) => {
        const optionCounts = countMap.get(id) ?? [];
        const totalResponses = optionCounts.reduce((sum, n) => sum + n, 0);
        const percentages = optionCounts.map((count) =>
          totalResponses === 0 ? 0 : parseFloat(((count / totalResponses) * 100).toFixed(2))
        );
        return { questionId: id, optionCounts, totalResponses, percentages };
      });

      setStats(computed);

      // Optionally fetch this guest's specific submissions
      if (guestId) {
        const { data: guestData, error: guestError } = await supabase
          .from('submissions')
          .select('*')
          .eq('guest_id', guestId);

        if (guestError) throw new Error(guestError.message);

        // Map snake_case DB columns → camelCase Submission type
        type RawSubmission = {
          id: string;
          guest_id: string;
          question_id: string;
          selected_option_index: number;
          created_at: string;
        };
        const mapped: Submission[] = ((guestData ?? []) as RawSubmission[]).map((row) => ({
          id: row.id,
          guestId: row.guest_id,
          questionId: row.question_id,
          selectedOptionIndex: row.selected_option_index,
          createdAt: row.created_at,
        }));

        setGuestSubmissions(mapped);
      } else {
        setGuestSubmissions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch results'));
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return { stats, guestSubmissions, loading, error };
}
