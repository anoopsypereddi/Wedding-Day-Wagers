import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface GameLockResult {
  isLocked: boolean
  lockAt: Date | null
  loading: boolean
  error: Error | null
}

/**
 * Reads `game_settings.lock_at` from Supabase once, then ticks locally so
 * `isLocked` flips to true at the exact moment the deadline passes — no
 * further DB calls needed.
 *
 * `isLocked` is also true immediately if the timestamp is already in the past.
 */
export function useGameLock(): GameLockResult {
  const [lockAt, setLockAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    supabase
      .from('game_settings')
      .select('lock_at')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) {
          setError(new Error(err.message))
        } else {
          setLockAt(data?.lock_at ? new Date(data.lock_at) : null)
        }
        setLoading(false)
      })
  }, [])

  // Tick every second while a future lock is pending so isLocked flips at the right moment
  useEffect(() => {
    if (!lockAt || now >= lockAt.getTime()) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [lockAt, now])

  const isLocked = lockAt !== null && now >= lockAt.getTime()

  return { isLocked, lockAt, loading, error }
}
