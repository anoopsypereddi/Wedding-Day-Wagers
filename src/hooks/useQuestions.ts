import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Question } from '../types';

interface UseQuestionsOptions {
  pollMs?: number
  includeInactive?: boolean
}

interface UseQuestionsResult {
  questions: Question[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

type Row = {
  id: string
  text: string
  options: string[]
  category: string
  correct_answer_index: number | null
  locked_at: string | null
  display_order: number
  is_active: boolean
}

function mapRow(row: Row): Question {
  return {
    id: row.id,
    text: row.text,
    options: row.options,
    category: row.category,
    correctAnswerIndex: row.correct_answer_index,
    lockedAt: row.locked_at,
    displayOrder: row.display_order,
    isActive: row.is_active,
  }
}

/**
 * Fetches questions ordered by display_order. Polls every `pollMs` (default 30s)
 * so guests see lock/reveal state changes without a manual refresh.
 */
export function useQuestions(options: UseQuestionsOptions = {}): UseQuestionsResult {
  const { pollMs = 30000, includeInactive = false } = options
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const firstLoadRef = useRef(true)

  const fetchQuestions = useCallback(async () => {
    try {
      let query = supabase.from('questions').select('*').order('display_order', { ascending: true })
      if (!includeInactive) query = query.eq('is_active', true)
      const { data, error: dbError } = await query

      if (dbError) throw new Error(dbError.message);

      setQuestions((data ?? []).map((r) => mapRow(r as Row)));
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch questions'));
    } finally {
      if (firstLoadRef.current) {
        setLoading(false)
        firstLoadRef.current = false
      }
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchQuestions();
    if (pollMs <= 0) return
    const id = setInterval(fetchQuestions, pollMs)
    return () => clearInterval(id)
  }, [fetchQuestions, pollMs]);

  return { questions, loading, error, refetch: fetchQuestions };
}
