import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGuestContext } from '../context/GuestContext'
import { useQuestions } from '../hooks/useQuestions'
import { useSubmission } from '../hooks/useSubmission'
import { useGameLock } from '../hooks/useGameLock'

/**
 * Shows every active question and lets the guest pick one answer each.
 * Submits all answers at once and navigates to the results page.
 * Redirects to /results if the game is locked (timer fired or answers revealed).
 */
export default function QuestionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { guest, logout } = useGuestContext()
  const { questions, loading: qLoading, error: qError } = useQuestions()
  const { submitAnswers, loading: submitting, error: submitError, success } = useSubmission()
  const { isLocked, loading: lockLoading } = useGameLock()

  // answers: { [questionId]: selectedOptionIndex }
  // Seeded from router state when coming back from the results "Edit answers" button
  const [answers, setAnswers] = useState<Record<string, number>>(
    (location.state as { initialAnswers?: Record<string, number> } | null)?.initialAnswers ?? {}
  )

  // Redirect unauthenticated visitors back to login
  useEffect(() => {
    if (!guest) navigate('/', { replace: true })
  }, [guest, navigate])

  // Redirect to results once we know the game is locked or answers have been revealed
  const answersRevealed =
    !qLoading &&
    questions.some(
      (q) =>
        q.correctAnswerIndex != null &&
        q.correctAnswerIndex >= 0 &&
        q.correctAnswerIndex < q.options.length,
    )

  useEffect(() => {
    if (!lockLoading && !qLoading && (isLocked || answersRevealed)) {
      navigate('/results', { replace: true })
    }
  }, [isLocked, answersRevealed, lockLoading, qLoading, navigate])

  if (!guest) return null

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)

  const handleSubmit = async () => {
    await submitAnswers(guest.id, answers)
    if (!submitError) navigate('/results')
  }

  if (qLoading || lockLoading) {
    return <LoadingScreen message="Loading…" />
  }

  if (qError) {
    return <ErrorScreen message={qError.message} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Make Your Predictions</h1>
            <p className="text-gray-600 text-sm">Hi {guest.name}! Pick one answer per question.</p>
          </div>
          <button
            onClick={logout}
            className="text-sm text-pastel-green-500 hover:text-pastel-green-600 underline"
          >
            Change name
          </button>
        </div>

        {/* Progress indicator */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pastel-pink-200 p-4">
          <p className="text-sm text-gray-600 mb-2">
            {Object.keys(answers).length} of {questions.length} questions answered
          </p>
          <div className="h-3 bg-pastel-green-100 rounded-full overflow-hidden border border-pastel-green-200">
            <div
              className="h-full bg-gradient-to-r from-pastel-pink-400 to-pastel-green-400 transition-all duration-300"
              style={{
                width: `${questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {/* Question cards */}
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="bg-white rounded-2xl shadow-md border border-pastel-pink-200 p-6 space-y-4"
          >
            <p className="font-semibold text-gray-800">
              {idx + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((option, optIdx) => {
                const selected = answers[q.id] === optIdx
                return (
                  <button
                    key={optIdx}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-colors text-sm font-medium ${
                      selected
                        ? 'border-pastel-pink-400 bg-pastel-pink-100 text-pastel-pink-600'
                        : 'border-pastel-green-200 bg-pastel-green-50 text-gray-700 hover:border-pastel-pink-300 hover:bg-pastel-pink-50'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Submit */}
        {submitError && <p className="text-red-500 text-sm">{submitError.message}</p>}
        {success && <p className="text-green-600 text-sm">Answers saved!</p>}

        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          className="w-full bg-gradient-to-r from-pastel-pink-400 to-pastel-green-400 hover:from-pastel-pink-500 hover:to-pastel-green-500 disabled:opacity-40 text-white font-semibold rounded-xl px-4 py-3 transition-colors shadow-md"
        >
          {submitting
            ? 'Submitting…'
            : allAnswered
            ? 'Submit Predictions'
            : `${Object.keys(answers).length} / ${questions.length} answered`}
        </button>
      </div>
    </div>
  )
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">{message}</div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-red-500">{message}</div>
  )
}
