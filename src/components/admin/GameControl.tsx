import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Question } from '../../types'

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

function mapRow(r: Row): Question {
  return {
    id: r.id,
    text: r.text,
    options: r.options,
    category: r.category,
    correctAnswerIndex: r.correct_answer_index,
    lockedAt: r.locked_at,
    displayOrder: r.display_order,
    isActive: r.is_active,
  }
}

function stateOf(q: Question): 'open' | 'locked' | 'scored' {
  if (q.correctAnswerIndex !== null && q.correctAnswerIndex !== undefined) return 'scored'
  if (q.lockedAt) return 'locked'
  return 'open'
}

export default function GameControl() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)

  const fetchQuestions = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    setQuestions((data ?? []).map((r) => mapRow(r as Row)))
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  async function toggleLock(q: Question) {
    setBusyId(q.id)
    setError(null)
    const nextLocked = q.lockedAt ? null : new Date().toISOString()
    // Unlocking a revealed question also clears the correct answer
    const update: Record<string, unknown> = { locked_at: nextLocked }
    if (!nextLocked && q.correctAnswerIndex !== null) {
      update.correct_answer_index = null
    }
    const { error: err } = await supabase.from('questions').update(update).eq('id', q.id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    fetchQuestions()
  }

  async function setCorrectAnswer(q: Question, optionIndex: number | null) {
    setBusyId(q.id)
    setError(null)
    const { error: err } = await supabase
      .from('questions')
      .update({ correct_answer_index: optionIndex })
      .eq('id', q.id)
    setBusyId(null)
    if (err) {
      setError(err.message)
      return
    }
    fetchQuestions()
  }

  async function lockAll() {
    setBulkBusy(true)
    setError(null)
    const ids = questions.filter((q) => !q.lockedAt).map((q) => q.id)
    if (ids.length > 0) {
      const { error: err } = await supabase
        .from('questions')
        .update({ locked_at: new Date().toISOString() })
        .in('id', ids)
      if (err) setError(err.message)
    }
    setBulkBusy(false)
    fetchQuestions()
  }

  async function unlockAll() {
    setBulkBusy(true)
    setError(null)
    const ids = questions.filter((q) => q.lockedAt).map((q) => q.id)
    if (ids.length > 0) {
      const { error: err } = await supabase
        .from('questions')
        .update({ locked_at: null, correct_answer_index: null })
        .in('id', ids)
      if (err) setError(err.message)
    }
    setBulkBusy(false)
    fetchQuestions()
  }

  if (loading) return <div className="text-gray-500">Loading…</div>

  const openCount = questions.filter((q) => stateOf(q) === 'open').length
  const lockedCount = questions.filter((q) => stateOf(q) === 'locked').length
  const scoredCount = questions.filter((q) => stateOf(q) === 'scored').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Game Control</h2>
          <p className="text-gray-500 text-sm mt-1">
            Lock each question to freeze picks. Reveal the correct answer to score it.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={lockAll}
            disabled={bulkBusy || openCount === 0}
            className="px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors"
          >
            🔒 Lock all open
          </button>
          <button
            onClick={unlockAll}
            disabled={bulkBusy || lockedCount + scoredCount === 0}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"
          >
            🔓 Unlock all
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 text-sm flex-wrap">
        <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700">
          {openCount} open
        </span>
        <span className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
          {lockedCount} locked
        </span>
        <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
          {scoredCount} scored
        </span>
      </div>

      {error && <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      <div className="space-y-3">
        {questions.map((q, i) => {
          const state = stateOf(q)
          const isBusy = busyId === q.id || bulkBusy

          return (
            <div
              key={q.id}
              className={`bg-white rounded-xl border p-4 ${
                state === 'scored'
                  ? 'border-emerald-200'
                  : state === 'locked'
                  ? 'border-amber-200'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-xs text-gray-400 font-mono">#{i + 1}</span>
                {q.category && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {q.category}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    state === 'open'
                      ? 'bg-green-100 text-green-600'
                      : state === 'locked'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {state === 'open' ? '🔓 Open' : state === 'locked' ? '🔒 Locked' : '✓ Scored'}
                </span>
              </div>

              <p className="text-gray-800 font-medium text-sm mb-3">{q.text}</p>

              {/* Correct-answer picker */}
              <div className="space-y-1.5 mb-3">
                {q.options.map((opt, oi) => {
                  const isChosen = q.correctAnswerIndex === oi
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                        isChosen
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                      } ${isBusy ? 'opacity-60 cursor-wait' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={isChosen}
                        disabled={isBusy}
                        onChange={() => setCorrectAnswer(q, oi)}
                        className="accent-emerald-500"
                      />
                      <span className="text-xs font-bold text-gray-400 w-4">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="text-gray-700">{opt}</span>
                      {isChosen && (
                        <span className="ml-auto text-xs font-semibold text-emerald-700">✓ Correct</span>
                      )}
                    </label>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => toggleLock(q)}
                  disabled={isBusy}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    q.lockedAt
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  } disabled:opacity-50`}
                >
                  {q.lockedAt ? '🔓 Unlock' : '🔒 Lock'}
                </button>
                {q.correctAnswerIndex !== null && (
                  <button
                    onClick={() => setCorrectAnswer(q, null)}
                    disabled={isBusy}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    Clear answer
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {questions.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            No active questions yet.
          </div>
        )}
      </div>
    </div>
  )
}
