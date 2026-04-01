import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Guest } from '../types';

interface UseGuestResult {
  findOrCreateGuest: (name: string) => Promise<Guest>;
  loading: boolean;
  error: Error | null;
}

/**
 * Provides a function that looks up a guest by name (case-insensitive)
 * and creates one if they don't exist yet.
 *
 * The returned guest object can be stored in component or context state
 * to identify the current user throughout the session.
 *
 * @example
 * const { findOrCreateGuest, loading, error } = useGuest();
 * const guest = await findOrCreateGuest('Alice');
 */
export function useGuest(): UseGuestResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const findOrCreateGuest = async (name: string): Promise<Guest> => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Guest name cannot be empty');

    setLoading(true);
    setError(null);

    try {
      // Look up by lower-cased name to match the case-insensitive unique index
      const { data: existing, error: lookupError } = await supabase
        .from('guests')
        .select('*')
        .ilike('name', trimmedName)
        .maybeSingle();

      if (lookupError) throw new Error(lookupError.message);

      if (existing) return existing as Guest;

      // Guest not found — create a new record
      const { data: created, error: insertError } = await supabase
        .from('guests')
        .insert({ name: trimmedName })
        .select()
        .single();

      if (insertError) {
        // Handle the rare race condition where another request inserted the same
        // name between our SELECT and INSERT (unique constraint violation).
        if (insertError.code === '23505') {
          const { data: retry, error: retryError } = await supabase
            .from('guests')
            .select('*')
            .ilike('name', trimmedName)
            .maybeSingle();

          if (retryError) throw new Error(retryError.message);
          if (retry) return retry as Guest;
        }
        throw new Error(insertError.message);
      }

      return created as Guest;
    } catch (err) {
      const wrapped = err instanceof Error ? err : new Error('Failed to find or create guest');
      setError(wrapped);
      throw wrapped;
    } finally {
      setLoading(false);
    }
  };

  return { findOrCreateGuest, loading, error };
}
