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
      const [questionsRes, guestsRes, submissionsRes] = await Promise.all([
        supabase.from('questions').select('id, correct_answer_index').eq('is_active', true),
        supabase.from('guests').select('id, name'),
        supabase.from('submissions').select('guest_id, question_id, selected_option_index'),
      ])

      if (questionsRes.error) throw new Error(questionsRes.error.message)
      if (guestsRes.error) throw new Error(guestsRes.error.message)
      if (submissionsRes.error) throw new Error(submissionsRes.error.message)

      type RawQ = { id: string; correct_answer_index: number | null }
      type RawSub = { guest_id: string; question_id: string; selected_option_index: number }

      const questions = (questionsRes.data ?? []) as RawQ[]
      const guests = (guestsRes.data ?? []) as { id: string; name: string }[]
      const submissions = (submissionsRes.data ?? []) as RawSub[]

      const answeredQs = questions.filter(q => q.correct_answer_index !== null)
      setAnsweredCount(answeredQs.length)

      if (answeredQs.length === 0) {
        setEntries([])
        setLoading(false)
        return
      }

      // Build answer key: questionId → correctIndex
      const answerKey = new Map<string, number>()
      for (const q of answeredQs) {
        if (q.correct_answer_index !== null) answerKey.set(q.id, q.correct_answer_index)
      }

      // Build submission map: guestId → Map<questionId, selectedIndex>
      const subMap = new Map<string, Map<string, number>>()
      for (const s of submissions) {
        if (!subMap.has(s.guest_id)) subMap.set(s.guest_id, new Map())
        subMap.get(s.guest_id)!.set(s.question_id, s.selected_option_index)
      }

      const scored: LeaderboardEntry[] = guests
        .filter(g => subMap.has(g.id))
        .map(g => {
          const guestSubs = subMap.get(g.id)!
          let correct = 0
          for (const [qId, correctIndex] of answerKey) {
            if (guestSubs.get(qId) === correctIndex) correct++
          }
          const total = answeredQs.length
          return {
            rank: 0,
            guestId: g.id,
            guestName: g.name,
            correct,
            total,
            percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
          }
        })
        .sort((a, b) => b.correct - a.correct || a.guestName.localeCompare(b.guestName))

      // Assign ranks (ties get the same rank)
      let currentRank = 1
      for (let i = 0; i < scored.length; i++) {
        if (i > 0 && scored[i].correct < scored[i - 1].correct) {
          currentRank = i + 1
        }
        scored[i].rank = currentRank
      }

      setEntries(scored)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load leaderboard'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  return { entries, answeredCount, loading, error, refetch: fetchLeaderboard }
}
