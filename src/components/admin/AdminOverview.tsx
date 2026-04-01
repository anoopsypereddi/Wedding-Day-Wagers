import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface Stats {
  totalQuestions: number
  activeQuestions: number
  totalGuests: number
  totalSubmissions: number
  questionsWithAnswers: number
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [questionsRes, guestsRes, submissionsRes, answeredRes] = await Promise.all([
          supabase.from('questions').select('is_active'),
          supabase.from('guests').select('id', { count: 'exact', head: true }),
          supabase.from('submissions').select('id', { count: 'exact', head: true }),
          supabase
            .from('questions')
            .select('id', { count: 'exact', head: true })
            .not('correct_answer_index', 'is', null),
        ])

        if (questionsRes.error) throw new Error(questionsRes.error.message)
        if (guestsRes.error) throw new Error(guestsRes.error.message)
        if (submissionsRes.error) throw new Error(submissionsRes.error.message)
        if (answeredRes.error) throw new Error(answeredRes.error.message)

        const rows = questionsRes.data ?? []
        const active = rows.filter((r) => r.is_active).length

        setStats({
          totalQuestions: rows.length,
          activeQuestions: active,
          totalGuests: guestsRes.count ?? 0,
          totalSubmissions: submissionsRes.count ?? 0,
          questionsWithAnswers: answeredRes.count ?? 0,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <div className="text-gray-500">Loading stats…</div>
  if (error) return <div className="text-red-500">{error}</div>
  if (!stats) return null

  const cards = [
    {
      label: 'Total Questions',
      value: stats.totalQuestions,
      sub: `${stats.activeQuestions} active`,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-700',
    },
    {
      label: 'Total Guests',
      value: stats.totalGuests,
      sub: 'registered',
      bg: 'bg-green-50',
      border: 'border-green-100',
      text: 'text-green-700',
    },
    {
      label: 'Submissions',
      value: stats.totalSubmissions,
      sub: 'individual answers',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      text: 'text-purple-700',
    },
    {
      label: 'Answers Marked',
      value: stats.questionsWithAnswers,
      sub: `of ${stats.totalQuestions} questions`,
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      text: 'text-rose-700',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Overview</h2>
        <p className="text-gray-500 text-sm mt-1">Game stats at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, bg, border, text }) => (
          <div key={label} className={`rounded-xl border p-5 ${bg} ${border} ${text}`}>
            <p className="text-3xl font-bold">{value}</p>
            <p className="font-medium mt-1 text-sm">{label}</p>
            <p className="text-xs opacity-70 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/questions"
            className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
          >
            Manage Questions →
          </Link>
          <Link
            to="/admin/answers"
            className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors"
          >
            Mark Correct Answers →
          </Link>
          <Link
            to="/admin/leaderboard"
            className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors"
          >
            View Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
