import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseSubmissionResult {
  upsertAnswer: (
    guestId: string,
    questionId: string,
    selectedOptionIndex: number
  ) => Promise<boolean>;
  savingId: string | null;
  error: Error | null;
}

/**
 * Writes a single guest answer. Returns true on success, false otherwise
 * (e.g. the question was locked between fetch and submit, so the trigger rejects it).
 *
 * `savingId` is the question id currently in flight, useful for per-card spinners.
 */
export function useSubmission(): UseSubmissionResult {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const upsertAnswer = async (
    guestId: string,
    questionId: string,
    selectedOptionIndex: number
  ): Promise<boolean> => {
    setSavingId(questionId);
    setError(null);

    try {
      const { error: upsertError } = await supabase
        .from('submissions')
        .upsert(
          {
            guest_id: guestId,
            question_id: questionId,
            selected_option_index: selectedOptionIndex,
          },
          { onConflict: 'guest_id,question_id', ignoreDuplicates: false },
        );

      if (upsertError) throw new Error(upsertError.message);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save answer'));
      return false;
    } finally {
      setSavingId(null);
    }
  };

  return { upsertAnswer, savingId, error };
}
