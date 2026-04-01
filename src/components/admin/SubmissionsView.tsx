import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface GuestRow {
  id: string
  name: string
  submissionCount: number
  lastSubmitted: string | null
  answers: { questionText: string; selectedOption: string }[]
}

export default function SubmissionsView() {
  const [guests, setGuests] = useState<GuestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchAll() {
      try {
        const [guestsRes, submissionsRes, questionsRes] = await Promise.all([
          supabase.from('guests').select('id, name').order('name'),
          supabase
            .from('submissions')
            .select('guest_id, question_id, selected_option_index, created_at')
            .order('created_at'),
          supabase.from('questions').select('id, text, options'),
        ])

        if (guestsRes.error) throw new Error(guestsRes.error.message)
        if (submissionsRes.error) throw new Error(submissionsRes.error.message)
        if (questionsRes.error) throw new Error(questionsRes.error.message)

        const questionMap = new Map<string, { text: string; options: string[] }>()
        for (const q of questionsRes.data ?? []) {
          questionMap.set(q.id, { text: q.text, options: q.options })
        }

        type RawSub = {
          guest_id: string
          question_id: string
          selected_option_index: number
          created_at: string
        }

        const subsByGuest = new Map<string, RawSub[]>()
        for (const sub of (submissionsRes.data ?? []) as RawSub[]) {
          if (!subsByGuest.has(sub.guest_id)) subsByGuest.set(sub.guest_id, [])
          subsByGuest.get(sub.guest_id)!.push(sub)
        }

        const result: GuestRow[] = (guestsRes.data ?? []).map(g => {
          const subs = subsByGuest.get(g.id) ?? []
          const lastSub = subs.length > 0 ? subs[subs.length - 1].created_at : null
          return {
            id: g.id,
            name: g.name,
            submissionCount: subs.length,
            lastSubmitted: lastSub,
            answers: subs.map(s => {
              const q = questionMap.get(s.question_id)
              return {
                questionText: q?.text ?? 'Unknown question',
                selectedOption: q?.options[s.selected_option_index] ?? `Option ${s.selected_option_index + 1}`,
              }
            }),
          }
        })

        setGuests(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exportCSV() {
    const rows: string[][] = [['Guest Name', 'Question', 'Answer', 'Submitted']]
    for (const g of guests) {
      if (g.answers.length === 0) continue
      for (const a of g.answers) {
        rows.push([
          g.name,
          a.questionText,
          a.selectedOption,
          g.lastSubmitted ? new Date(g.lastSubmitted).toLocaleString() : '',
        ])
      }
    }
    const csv = rows
      .map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wedding_game_submissions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = guests.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  )
  const withSubs = filtered.filter(g => g.submissionCount > 0)
  const withoutSubs = filtered.filter(g => g.submissionCount === 0)

  if (loading) return <div className="text-gray-500">Loading submissions…</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Submissions</h2>
          <p className="text-gray-500 text-sm mt-1">
            {guests.filter(g => g.submissionCount > 0).length} of {guests.length} guests submitted
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
      />

      <div className="space-y-2">
        {withSubs.map(g => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleExpand(g.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm shrink-0">
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{g.name}</p>
                  <p className="text-xs text-gray-400">
                    {g.submissionCount} answer{g.submissionCount !== 1 ? 's' : ''}
                    {g.lastSubmitted && (
                      <> · {new Date(g.lastSubmitted).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
              <span className="text-gray-400 text-xs">{expanded.has(g.id) ? '▲' : '▼'}</span>
            </button>

            {expanded.has(g.id) && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                {g.answers.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="text-gray-400 text-xs mt-0.5 w-5 shrink-0">{i + 1}.</span>
                    <div>
                      <p className="text-gray-600 text-xs">{a.questionText}</p>
                      <p className="text-rose-600 font-medium text-sm mt-0.5">→ {a.selectedOption}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {withSubs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {search ? 'No guests match your search.' : 'No submissions yet.'}
          </div>
        )}
      </div>

      {withoutSubs.length > 0 && !search && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs font-medium text-amber-700 mb-2">
            {withoutSubs.length} guest{withoutSubs.length !== 1 ? 's' : ''} registered but haven't submitted:
          </p>
          <div className="flex flex-wrap gap-2">
            {withoutSubs.map(g => (
              <span key={g.id} className="text-xs bg-white border border-amber-200 text-amber-600 px-2 py-1 rounded-full">
                {g.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
