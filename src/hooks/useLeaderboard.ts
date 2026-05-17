import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface LeaderboardEntry {
  rank: number
  guestId: string
  guestName: string
  correct: number
  total: number
  percentage: number
}

interface UseLeaderboardResult {
  entries: LeaderboardEntry[]
  answeredCount: number
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useLeaderboard(): UseLeaderboardResult {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [answeredCount, setAnsweredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('get_leaderboard')
      if (rpcError) throw new Error(rpcError.message)

      type RawRow = {
        rank: number
        guest_id: string
        guest_name: string
        correct: number
        total: number
        percentage: number
      }

      const rows = (data ?? []) as RawRow[]

      setAnsweredCount(rows[0]?.total ?? 0)
      setEntries(
        rows.map(r => ({
          rank: r.rank,
          guestId: r.guest_id,
          guestName: r.guest_name,
          correct: r.correct,
          total: r.total,
          percentage: r.percentage,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load leaderboard'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  return { entries, answeredCount, loading, error, refetch: fetchLeaderboard }
}
