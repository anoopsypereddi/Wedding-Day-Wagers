import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseSubmissionResult {
  submitAnswers: (
    guestId: string,
    answers: Record<string, number>
  ) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}

/**
 * Batch-upserts the guest's picks. Pass only the picks the user has
 * changed since the last submit; the server upserts on the
 * (guest_id, question_id) unique pair.
 *
 * Returns true on success. The submissions trigger rejects writes against
 * locked questions — filter those out client-side before calling.
 */
export function useSubmission(): UseSubmissionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitAnswers = async (
    guestId: string,
    answers: Record<string, number>
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const rows = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        guest_id: guestId,
        question_id: questionId,
        selected_option_index: selectedIndex,
      }));

      if (rows.length === 0) return true;

      const { error: upsertError } = await supabase
        .from('submissions')
        .upsert(rows, { onConflict: 'guest_id,question_id', ignoreDuplicates: false });

      if (upsertError) throw new Error(upsertError.message);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit answers'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitAnswers, loading, error };
}
