import { useNavigate } from 'react-router-dom'
import { useGuestContext } from '../context/GuestContext'
import { useQuestions } from '../hooks/useQuestions'
import { useResults } from '../hooks/useResults'

/**
 * Shows aggregated answer statistics for every question and highlights
 * the current guest's own picks. If correct answers have been revealed,
 * shows whether each pick was right.
 */
export default function ResultsPage() {
  const navigate = useNavigate()
  const { guest } = useGuestContext()
  const { questions, loading: qLoading } = useQuestions()
  const { stats, guestSubmissions, loading: rLoading } = useResults(guest?.id ?? null)

  if (!guest) {
    navigate('/')
    return null
  }

  if (qLoading || rLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading results…
      </div>
    )
  }

  // Build quick lookup maps
  const statsMap = new Map(stats.map((s) => [s.questionId, s]))
  const myAnswers = new Map(guestSubmissions.map((s) => [s.questionId, s.selectedOptionIndex]))

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Results</h1>
            <p className="text-gray-500 text-sm">See how everyone voted, {guest.name}!</p>
          </div>
          <button
            onClick={() => navigate('/questions')}
            className="text-sm text-pink-500 hover:text-pink-700 underline"
          >
            Edit answers
          </button>
        </div>

        {questions.map((q, idx) => {
          const s = statsMap.get(q.id)
          const myPick = myAnswers.get(q.id)

          return (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
              <p className="font-semibold text-gray-800">
                {idx + 1}. {q.text}
              </p>

              <div className="space-y-2">
                {q.options.map((option, optIdx) => {
                  const pct = s?.percentages[optIdx] ?? 0
                  const count = s?.optionCounts[optIdx] ?? 0
                  const isMyPick = myPick === optIdx
                  const isCorrect = q.correctAnswerIndex === optIdx

                  return (
                    <div key={optIdx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`flex items-center gap-1 ${
                            isMyPick ? 'font-semibold text-pink-600' : 'text-gray-700'
                          }`}
                        >
                          {isMyPick && <span title="Your pick">★</span>}
                          {isCorrect && <span title="Correct answer">✓</span>}
                          {option}
                        </span>
                        <span className="text-gray-400">
                          {count} {count === 1 ? 'vote' : 'votes'} · {pct}%
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            isCorrect
                              ? 'bg-green-400'
                              : isMyPick
                              ? 'bg-pink-400'
                              : 'bg-gray-300'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {s && (
                <p className="text-xs text-gray-400">
                  {s.totalResponses} total {s.totalResponses === 1 ? 'response' : 'responses'}
                </p>
              )}
            </div>
          )
        })}

        <p className="text-center text-xs text-gray-400 pb-4">
          ★ = your pick &nbsp;·&nbsp; ✓ = correct answer (revealed after the wedding)
        </p>
      </div>
    </div>
  )
}
