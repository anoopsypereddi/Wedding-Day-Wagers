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
    <div className="bg-white rounded-2xl shadow-md border border-pastel-pink-200 p-6 relative overflow-hidden">
      {/* Subtle decorative flower */}
      <div className="absolute top-2 right-3 text-lg opacity-30">🌺</div>

      <p className="text-xs font-medium text-pastel-green-500 uppercase tracking-wide mb-1 flex items-center gap-1">
        <span className="text-xs">🌿</span>
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
                      isCorrect ? 'bg-pastel-green-200 text-pastel-green-600' : 'bg-gray-100 text-gray-500',
                    ].join(' ')}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                  {isGuest && (
                    <span className="ml-1 text-xs text-pastel-pink-500 font-medium">(your pick)</span>
                  )}
                  {isCorrect && (
                    <span className="ml-1 text-xs text-pastel-green-500 font-medium">✓ correct</span>
                  )}
                </span>
                <span className="font-semibold text-gray-600">{pct.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 bg-pastel-green-100 rounded-full overflow-hidden border border-pastel-green-200">
                <div
                  className={[
                    'h-full rounded-full transition-all duration-500',
                    isCorrect ? 'bg-pastel-green-400' : isGuest ? 'bg-pastel-pink-400' : 'bg-gray-300',
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
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 py-10 px-4 relative">
      {/* Large decorative corner flowers */}
      <div className="fixed top-4 left-4 text-6xl opacity-20 animate-float pointer-events-none">🌺</div>
      <div className="fixed top-4 right-4 text-5xl opacity-15 animate-float-delayed pointer-events-none">🌸</div>
      <div className="fixed bottom-4 left-4 text-5xl opacity-15 animate-float pointer-events-none">🌿</div>
      <div className="fixed bottom-4 right-4 text-6xl opacity-20 animate-float-delayed pointer-events-none">🌺</div>

      <div className="max-w-xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🌸</span>
            <span className="text-4xl">📊</span>
            <span className="text-2xl">🌸</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            <span className="inline-block mr-2">🌺</span>
            Results
            <span className="inline-block ml-2">🌺</span>
          </h1>
          <p className="text-gray-600 text-sm mt-1">See how the crowd voted!</p>
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
