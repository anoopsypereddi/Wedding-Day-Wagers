import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Question } from '../types';

interface UseQuestionsResult {
  questions: Question[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches all active questions ordered by display_order.
 *
 * @example
 * const { questions, loading, error, refetch } = useQuestions();
 */
export function useQuestions(): UseQuestionsResult {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (dbError) throw new Error(dbError.message);

      // Map snake_case DB columns → camelCase Question type
      const mapped: Question[] = (data ?? []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        text: row.text as string,
        options: row.options as string[],
        category: row.category as string,
        correctAnswerIndex: row.correct_answer_index as number,
        displayOrder: row.display_order as number,
        isActive: row.is_active as boolean,
      }))

      setQuestions(mapped);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch questions'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return { questions, loading, error, refetch: fetchQuestions };
}
