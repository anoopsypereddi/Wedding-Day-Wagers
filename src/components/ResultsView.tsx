import type { Question, QuestionStats } from '../types'

interface ResultsViewProps {
  questions: Question[]
  stats: QuestionStats[]
  guestAnswers?: Record<string, number>
}

function ResultRow({
  question,
  stat,
  guestAnswer,
}: {
  question: Question
  stat: QuestionStats
  guestAnswer?: number
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <p className="text-xs font-medium text-pink-500 uppercase tracking-wide mb-1">
        {question.category}
      </p>
      <h2 className="text-base font-semibold text-gray-800 mb-4">{question.text}</h2>

      <div className="space-y-3">
        {question.options.map((option, i) => {
          const pct = stat.percentages[i] ?? 0
          const isCorrect = i === question.correctAnswerIndex
          const isGuest = guestAnswer === i

          return (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-1 text-gray-700">
                  <span
                    className={[
                      'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                      isCorrect ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                    ].join(' ')}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                  {isGuest && (
                    <span className="ml-1 text-xs text-pink-500 font-medium">(your pick)</span>
                  )}
                  {isCorrect && (
                    <span className="ml-1 text-xs text-green-600 font-medium">✓ correct</span>
                  )}
                </span>
                <span className="font-semibold text-gray-600">{pct.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-500',
                    isCorrect ? 'bg-green-400' : isGuest ? 'bg-pink-400' : 'bg-gray-300',
                  ].join(' ')}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {stat.optionCounts[i] ?? 0} vote{(stat.optionCounts[i] ?? 0) !== 1 ? 's' : ''}
              </p>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4">
        {stat.totalResponses} total response{stat.totalResponses !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export default function ResultsView({ questions, stats, guestAnswers }: ResultsViewProps) {
  const statsById = Object.fromEntries(stats.map((s) => [s.questionId, s]))

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-4xl">📊</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Results</h1>
          <p className="text-gray-500 text-sm mt-1">See how the crowd voted!</p>
        </div>

        <div className="space-y-5">
          {questions.map((q) => {
            const stat = statsById[q.id]
            if (!stat) return null
            return (
              <ResultRow
                key={q.id}
                question={q}
                stat={stat}
                guestAnswer={guestAnswers?.[q.id]}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
