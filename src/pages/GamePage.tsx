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
 * Picks are kept in local state until the guest hits Submit, which writes only
 * the unsaved picks for questions still open.
 */
export default function GamePage() {
  const navigate = useNavigate()
  const { guest, logout } = useGuestContext()
  const { questions, loading: qLoading, error: qError } = useQuestions()
  const { stats, guestSubmissions, loading: rLoading, refetch: refetchResults } = useResults(
    guest?.id ?? null,
  )
  const { submitAnswers, loading: submitting } = useSubmission()

  const [localPicks, setLocalPicks] = useState<Record<string, number>>({})
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [savedToast, setSavedToast] = useState(false)

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

  const openQuestions = questions.filter((q) => !q.lockedAt)
  const unsavedIds = openQuestions
    .filter((q) => q.id in localPicks && localPicks[q.id] !== submissionMap.get(q.id))
    .map((q) => q.id)

  const handlePick = (questionId: string, optionIndex: number) => {
    setErrorMsg(null)
    setSavedToast(false)
    setLocalPicks((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleSubmit = async () => {
    if (unsavedIds.length === 0) return
    setErrorMsg(null)
    const payload: Record<string, number> = {}
    for (const id of unsavedIds) payload[id] = localPicks[id]

    const ok = await submitAnswers(guest.id, payload)
    if (!ok) {
      setErrorMsg('Could not save your picks. One of the questions may have just locked — refresh and try again.')
      return
    }

    // Refresh server state, then drop saved local picks so the UI reflects the
    // canonical server values.
    await refetchResults()
    setLocalPicks((prev) => {
      const next = { ...prev }
      for (const id of unsavedIds) delete next[id]
      return next
    })
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2500)
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

  const answeredOpen = openQuestions.filter((q) => pickFor(q.id) !== null).length
  const hasUnsaved = unsavedIds.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 px-4 py-8 pb-28">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Wedding Wagers</h1>
            <p className="text-gray-600 text-sm">Hi {guest.name}! Tap an option, then hit Submit.</p>
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
              {hasUnsaved && (
                <span className="ml-2 text-pastel-pink-600 font-semibold">
                  · {unsavedIds.length} unsaved
                </span>
              )}
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
        {savedToast && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
            ✓ Picks saved
          </div>
        )}

        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            myPick={pickFor(q.id)}
            stats={statsMap.get(q.id)}
            onPick={(idx) => handlePick(q.id, idx)}
            saving={submitting}
          />
        ))}

        {questions.length === 0 && (
          <div className="text-center text-gray-400 py-12 bg-white/60 rounded-xl border border-pastel-pink-200">
            No questions yet — check back in a bit.
          </div>
        )}
      </div>

      {/* Sticky submit bar */}
      {openQuestions.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-pastel-pink-200 px-4 py-3 z-20">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={!hasUnsaved || submitting}
              className="w-full bg-gradient-to-r from-pastel-pink-400 to-pastel-green-400 hover:from-pastel-pink-500 hover:to-pastel-green-500 disabled:opacity-40 text-white font-semibold rounded-xl px-4 py-3 transition-colors shadow-md"
            >
              {submitting
                ? 'Submitting…'
                : hasUnsaved
                ? `Submit ${unsavedIds.length} pick${unsavedIds.length === 1 ? '' : 's'}`
                : 'All picks saved'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
