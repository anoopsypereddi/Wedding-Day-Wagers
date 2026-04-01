import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseSubmissionResult {
  submitAnswers: (guestId: string, answers: Record<string, number>) => Promise<void>;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

/**
 * Provides a function to upsert a guest's answers and update their
 * last_viewed_at timestamp in a single batch operation.
 *
 * @example
 * const { submitAnswers, loading, error, success } = useSubmission();
 * await submitAnswers(guest.id, { [questionId]: selectedIndex });
 */
export function useSubmission(): UseSubmissionResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const submitAnswers = async (
    guestId: string,
    answers: Record<string, number>
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Build the rows to upsert — one per answered question
      const rows = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        guest_id: guestId,
        question_id: questionId,
        selected_option_index: selectedIndex,
      }));

      if (rows.length === 0) return;

      // Batch upsert: insert or overwrite on the unique (guest_id, question_id) pair
      const { error: upsertError } = await supabase
        .from('submissions')
        .upsert(rows, {
          onConflict: 'guest_id,question_id',
          ignoreDuplicates: false,
        });

      if (upsertError) throw new Error(upsertError.message);

      // Update the guest's last_viewed_at to now
      const { error: guestError } = await supabase
        .from('guests')
        .update({ last_viewed_at: new Date().toISOString() })
        .eq('id', guestId);

      if (guestError) throw new Error(guestError.message);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit answers'));
    } finally {
      setLoading(false);
    }
  };

  return { submitAnswers, loading, error, success };
}
