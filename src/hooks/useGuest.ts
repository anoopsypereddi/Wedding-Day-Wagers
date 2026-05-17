import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Guest } from '../types';

interface UseGuestResult {
  findOrCreateGuest: (name: string, phone: string) => Promise<Guest>;
  loading: boolean;
  error: Error | null;
}

/** Digits-only form of a phone number — used as the uniqueness key. */
function normalizePhone(phone: string): string {
  return phone.replace(/\D+/g, '');
}

/**
 * Provides a function that looks up a guest by phone (digits-only) and
 * creates one if they don't exist yet. Phone is the unique identifier so
 * two guests can share the same display name.
 */
export function useGuest(): UseGuestResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const findOrCreateGuest = async (name: string, phone: string): Promise<Guest> => {
    const trimmedName = name.trim();
    const normalized = normalizePhone(phone);
    if (!trimmedName) throw new Error('Guest name cannot be empty');
    if (normalized.length < 7) throw new Error('Please enter a valid phone number');

    setLoading(true);
    setError(null);

    try {
      // Look up by digits-only phone (matches the unique index).
      const { data: existing, error: lookupError } = await supabase
        .from('guests')
        .select('*')
        .eq('phone', normalized)
        .maybeSingle();

      if (lookupError) throw new Error(lookupError.message);

      if (existing) return existing as Guest;

      const { data: created, error: insertError } = await supabase
        .from('guests')
        .insert({ name: trimmedName, phone: normalized })
        .select()
        .single();

      if (insertError) {
        // Race: another request inserted the same phone between SELECT and INSERT.
        if (insertError.code === '23505') {
          const { data: retry, error: retryError } = await supabase
            .from('guests')
            .select('*')
            .eq('phone', normalized)
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
