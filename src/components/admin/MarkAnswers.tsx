import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import type { Question } from '../../types'

export default function MarkAnswers() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (err) { setError(err.message); setLoading(false); return }

    const mapped: Question[] = (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      text: row.text as string,
      options: row.options as string[],
      category: row.category as string,
      correctAnswerIndex: row.correct_answer_index as number,
      displayOrder: row.display_order as number,
      isActive: row.is_active as boolean,
    }))

    setQuestions(mapped)
    const initialAnswers: Record<string, number | null> = {}
    for (const q of mapped) {
      initialAnswers[q.id] = q.correctAnswerIndex ?? null
    }
    setAnswers(initialAnswers)
    setLoading(false)
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchQuestions() }, [fetchQuestions])

  async function saveAll() {
    setSaving(true)
    setSaved(false)

    const updates = questions.map(q =>
      supabase
        .from('questions')
        .update({ correct_answer_index: answers[q.id] })
        .eq('id', q.id)
    )

    const results = await Promise.all(updates)
    const failed = results.find(r => r.error)
    setSaving(false)

    if (failed?.error) { setError(failed.error.message); return }

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    fetchQuestions()
  }

  const markedCount = Object.values(answers).filter(v => v !== null && v !== undefined).length

  if (loading) return <div className="text-gray-500">Loading questions…</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mark Correct Answers</h2>
          <p className="text-gray-500 text-sm mt-1">
            {markedCount} of {questions.length} marked
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              ✓ Saved
            </span>
          )}
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save All Answers'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 text-sm">Progress</span>
          <span className="text-gray-500 text-sm">{markedCount} / {questions.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full transition-all duration-300"
            style={{ width: questions.length > 0 ? `${(markedCount / questions.length) * 100}%` : '0%' }}
          />
        </div>
        {markedCount === questions.length && questions.length > 0 && (
          <p className="text-xs text-emerald-600 mt-2">
            All answers marked! Guests can now see their scores.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const selectedIndex = answers[q.id]
          const isMarked = selectedIndex !== null && selectedIndex !== undefined

          return (
            <div
              key={q.id}
              className={`bg-white rounded-xl border p-4 transition-colors ${
                isMarked ? 'border-emerald-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">#{i + 1}</span>
                  {q.category && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {q.category}
                    </span>
                  )}
                </div>
                {isMarked && (
                  <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full shrink-0">
                    ✓ Marked
                  </span>
                )}
              </div>

              <p className="text-gray-800 font-medium text-sm mb-3">{q.text}</p>

              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedIndex === oi
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={selectedIndex === oi}
                      onChange={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs font-bold text-gray-400 w-4">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>

              {isMarked && (
                <button
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: null }))}
                  className="mt-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  Clear answer
                </button>
              )}
            </div>
          )
        })}

        {questions.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            No active questions found.
          </div>
        )}
      </div>

      {questions.length > 3 && (
        <div className="flex justify-end pb-4">
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-6 py-2 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save All Answers'}
          </button>
        </div>
      )}
    </div>
  )
}
