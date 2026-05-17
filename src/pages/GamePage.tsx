import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestContext } from '../context/GuestContext'
import { useQuestions } from '../hooks/useQuestions'
import { useResults } from '../hooks/useResults'
import { useSubmission } from '../hooks/useSubmission'
import QuestionCard from '../components/QuestionCard'

/**
 * Unified game feed. Each question renders as a single card that flips through
 * three modes (open / locked / scored) based on its server-side state.
 *
 * Picks autosave per click: optimistic local update, single upsert, roll back
 * if the server rejects (e.g. the question locked between fetch and write).
 */
export default function GamePage() {
  const navigate = useNavigate()
  const { guest, logout } = useGuestContext()
  const { questions, loading: qLoading, error: qError } = useQuestions()
  const { stats, guestSubmissions, loading: rLoading } = useResults(guest?.id ?? null)
  const { upsertAnswer, savingId } = useSubmission()

  // Per-question optimistic overrides keyed by questionId. Falls back to the
  // server submission when an entry is absent.
  const [localPicks, setLocalPicks] = useState<Record<string, number>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!guest) navigate('/', { replace: true })
  }, [guest, navigate])

  if (!guest) return null

  const submissionMap = new Map(guestSubmissions.map((s) => [s.questionId, s.selectedOptionIndex]))
  const statsMap = new Map(stats.map((s) => [s.questionId, s]))

  const pickFor = (qId: string): number | null => {
    if (qId in localPicks) return localPicks[qId]
    return submissionMap.get(qId) ?? null
  }

  const handlePick = async (questionId: string, optionIndex: number) => {
    setErrorMsg(null)

    // Don't re-write the same answer
    if (pickFor(questionId) === optionIndex) return

    const previous = pickFor(questionId)
    setLocalPicks((prev) => ({ ...prev, [questionId]: optionIndex }))

    const ok = await upsertAnswer(guest.id, questionId, optionIndex)
    if (!ok) {
      // Roll back to the previous value (or remove the override entirely)
      setLocalPicks((prev) => {
        const next = { ...prev }
        if (previous === null) delete next[questionId]
        else next[questionId] = previous
        return next
      })
      setErrorMsg('Could not save that pick — the question may have just locked.')
    }
  }

  if (qLoading || rLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>
    )
  }

  if (qError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {qError.message}
      </div>
    )
  }

  const openQuestions = questions.filter((q) => !q.lockedAt)
  const answeredOpen = openQuestions.filter((q) => pickFor(q.id) !== null).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Wedding Wagers</h1>
            <p className="text-gray-600 text-sm">Hi {guest.name}! Tap an option to place your bet.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-sm text-pastel-pink-500 hover:text-pastel-pink-600 underline"
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={logout}
              className="text-sm text-pastel-green-500 hover:text-pastel-green-600 underline"
            >
              Change name
            </button>
          </div>
        </div>

        {/* Progress */}
        {openQuestions.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pastel-pink-200 p-4">
            <p className="text-sm text-gray-600 mb-2">
              {answeredOpen} of {openQuestions.length} open questions answered
            </p>
            <div className="h-3 bg-pastel-green-100 rounded-full overflow-hidden border border-pastel-green-200">
              <div
                className="h-full bg-gradient-to-r from-pastel-pink-400 to-pastel-green-400 transition-all duration-300"
                style={{
                  width: `${
                    openQuestions.length > 0 ? (answeredOpen / openQuestions.length) * 100 : 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {errorMsg}
          </div>
        )}

        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            myPick={pickFor(q.id)}
            stats={statsMap.get(q.id)}
            onPick={(idx) => handlePick(q.id, idx)}
            saving={savingId === q.id}
          />
        ))}

        {questions.length === 0 && (
          <div className="text-center text-gray-400 py-12 bg-white/60 rounded-xl border border-pastel-pink-200">
            No questions yet — check back in a bit.
          </div>
        )}
      </div>
    </div>
  )
}
