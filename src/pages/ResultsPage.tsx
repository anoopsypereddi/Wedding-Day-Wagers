import { useNavigate } from 'react-router-dom'
import { useGuestContext } from '../context/GuestContext'
import { useQuestions } from '../hooks/useQuestions'
import { useResults } from '../hooks/useResults'
import { useGameLock } from '../hooks/useGameLock'

const SEGMENT_COLORS = ['#f9a8d4', '#86efac', '#93c5fd', '#fcd34d', '#c4b5fd']

function DonutChart({
  percentages,
  myPick,
  correctIndex,
}: {
  percentages: number[]
  myPick?: number
  correctIndex?: number
}) {
  const r = 38
  const circumference = 2 * Math.PI * r
  const revealed = correctIndex !== undefined && correctIndex >= 0

  const segmentStarts = percentages.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + percentages[i - 1])
    return acc
  }, [])

  const segmentColor = (i: number) => {
    if (revealed && i === correctIndex) return '#4ade80' // green-400
    if (revealed && i === myPick && i !== correctIndex) return '#fca5a5' // red-300
    return SEGMENT_COLORS[i % SEGMENT_COLORS.length]
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
      {percentages.map((pct, i) => {
        const startAt = segmentStarts[i]
        if (pct === 0) return null
        const segLen = (pct / 100) * circumference
        const isHighlighted = i === correctIndex || i === myPick
        return (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={segmentColor(i)}
            strokeWidth={isHighlighted ? 15 : 10}
            strokeDasharray={`${segLen} ${circumference}`}
            strokeDashoffset={-(startAt / 100) * circumference}
            className="transition-all duration-500"
          />
        )
      })}
      <circle cx="50" cy="50" r="28" fill="white" />
    </svg>
  )
}

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
  const { isLocked } = useGameLock()

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

  const answersRevealed = questions.some(
    (q) => q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length,
  )
  const editingLocked = isLocked || answersRevealed

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Results
            </h1>
            <p className="text-gray-600 text-sm">See how everyone voted, {guest.name}!</p>
          </div>
          {!editingLocked && (
            <button
              onClick={() => navigate('/questions', { state: { initialAnswers: Object.fromEntries(myAnswers) } })}
              className="text-sm text-pastel-pink-500 hover:text-pastel-pink-600 underline"
            >
              Edit answers
            </button>
          )}
          {editingLocked && (
            <span className="text-xs text-gray-400 flex items-center gap-1">🔒 Locked</span>
          )}
        </div>

        {questions.map((q, idx) => {
          const s = statsMap.get(q.id)
          const myPick = myAnswers.get(q.id)

          const revealed = q.correctAnswerIndex >= 0 && q.correctAnswerIndex < q.options.length

          return (
            <div key={q.id} className="bg-white rounded-2xl shadow-md border border-pastel-pink-200 p-6 space-y-4">
              <p className="font-semibold text-gray-800">
                {idx + 1}. {q.text}
              </p>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                {/* Donut chart */}
                <div className="w-28 h-28 shrink-0 self-center sm:self-auto">
                  <DonutChart
                    percentages={q.options.map((_, i) => s?.percentages[i] ?? 0)}
                    myPick={myPick}
                    correctIndex={revealed ? q.correctAnswerIndex : undefined}
                  />
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {q.options.map((option, optIdx) => {
                    const pct = s?.percentages[optIdx] ?? 0
                    const isMyPick = myPick === optIdx
                    const isCorrect = revealed && q.correctAnswerIndex === optIdx
                    const isWrongPick = revealed && isMyPick && !isCorrect

                    const rowClass = isCorrect
                      ? 'bg-green-50 border border-green-300 rounded-lg px-2 py-1.5'
                      : isWrongPick
                      ? 'bg-red-50 border border-red-200 rounded-lg px-2 py-1.5'
                      : 'px-2 py-1.5'

                    const dotColor = isCorrect
                      ? '#4ade80'
                      : isWrongPick
                      ? '#fca5a5'
                      : SEGMENT_COLORS[optIdx % SEGMENT_COLORS.length]

                    return (
                      <div key={optIdx} className={`flex items-start gap-2 text-sm ${rowClass}`}>
                        <span
                          className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: dotColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`break-words ${isCorrect ? 'font-bold text-green-800' : isWrongPick ? 'text-red-700' : 'text-gray-600'}`}>
                            {option}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {isCorrect && (
                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                                ✓ Correct
                              </span>
                            )}
                            {isMyPick && (
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${isCorrect ? 'text-green-700 bg-green-100' : 'text-pink-700 bg-pink-100'}`}>
                                ★ You
                              </span>
                            )}
                            <span className="text-gray-400 text-xs">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {s && (
                <p className="text-xs text-gray-400">
                  {s.totalResponses} total {s.totalResponses === 1 ? 'response' : 'responses'}
                </p>
              )}
            </div>
          )
        })}

        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-pastel-pink-200 p-4">
          <p className="text-center text-xs text-gray-500">
            Correct answers revealed after the wedding 💍
          </p>
        </div>
      </div>
    </div>
  )
}
