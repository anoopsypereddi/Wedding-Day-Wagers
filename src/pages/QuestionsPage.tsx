import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestContext } from '../context/GuestContext'
import { useQuestions } from '../hooks/useQuestions'
import { useSubmission } from '../hooks/useSubmission'

/**
 * Shows every active question and lets the guest pick one answer each.
 * Submits all answers at once and navigates to the results page.
 */
export default function QuestionsPage() {
  const navigate = useNavigate()
  const { guest, logout } = useGuestContext()
  const { questions, loading: qLoading, error: qError } = useQuestions()
  const { submitAnswers, loading: submitting, error: submitError, success } = useSubmission()

  // answers: { [questionId]: selectedOptionIndex }
  const [answers, setAnswers] = useState<Record<string, number>>({})

  // Redirect unauthenticated visitors back to login
  if (!guest) {
    navigate('/')
    return null
  }

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)

  const handleSubmit = async () => {
    await submitAnswers(guest.id, answers)
    if (!submitError) navigate('/results')
  }

  if (qLoading) {
    return <LoadingScreen message="Loading questions…" />
  }

  if (qError) {
    return <ErrorScreen message={qError.message} />
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Make Your Predictions</h1>
            <p className="text-gray-500 text-sm">Hi {guest.name}! Pick one answer per question.</p>
          </div>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-gray-600 underline">
            Change name
          </button>
        </div>

        {/* Question cards */}
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
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
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors text-sm ${
                      selected
                        ? 'border-pink-400 bg-pink-50 text-pink-700 font-medium'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-pink-200 hover:bg-pink-50/50'
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
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white font-semibold rounded-xl px-4 py-3 transition-colors"
        >
          {submitting ? 'Submitting…' : allAnswered ? 'Submit Predictions' : `${Object.keys(answers).length} / ${questions.length} answered`}
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
