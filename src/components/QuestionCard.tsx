import type { Question, QuestionStats } from '../types'

const SEGMENT_COLORS = ['#f9a8d4', '#86efac', '#93c5fd', '#fcd34d', '#c4b5fd']

interface QuestionCardProps {
  question: Question
  myPick: number | null
  stats?: QuestionStats
  onPick: (optionIndex: number) => void
  saving?: boolean
}

type Mode = 'open' | 'locked' | 'scored'

function modeFor(q: Question): Mode {
  if (q.correctAnswerIndex !== null && q.correctAnswerIndex !== undefined) return 'scored'
  if (q.lockedAt) return 'locked'
  return 'open'
}

function DonutChart({
  percentages,
  myPick,
  correctIndex,
}: {
  percentages: number[]
  myPick: number | null
  correctIndex: number | null
}) {
  const r = 38
  const circumference = 2 * Math.PI * r
  const revealed = correctIndex !== null && correctIndex !== undefined && correctIndex >= 0

  const segmentStarts = percentages.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + percentages[i - 1])
    return acc
  }, [])

  const segmentColor = (i: number) => {
    if (revealed && i === correctIndex) return '#4ade80'
    if (revealed && i === myPick && i !== correctIndex) return '#fca5a5'
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

function OpenFace({
  question,
  myPick,
  saving,
  onPick,
}: {
  question: Question
  myPick: number | null
  saving: boolean
  onPick: (i: number) => void
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-pastel-pink-200 p-6 w-full h-full relative overflow-hidden">
      <div className="absolute top-2 right-3 text-lg opacity-30">🌸</div>
      {question.category && (
        <p className="text-xs font-medium text-pastel-green-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <span className="text-xs">🌿</span>
          {question.category}
        </p>
      )}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{question.text}</h2>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = myPick === i
          return (
            <button
              key={i}
              onClick={() => onPick(i)}
              disabled={saving}
              className={[
                'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition',
                isSelected
                  ? 'border-pastel-pink-400 bg-pastel-pink-100 text-pastel-pink-600'
                  : 'border-pastel-green-200 bg-pastel-green-50 text-gray-700 hover:border-pastel-pink-300 hover:bg-pastel-pink-50',
                saving ? 'cursor-wait opacity-70' : 'cursor-pointer',
              ].join(' ')}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-current mr-2 text-xs shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ScoreFace({
  question,
  myPick,
  stats,
  mode,
}: {
  question: Question
  myPick: number | null
  stats?: QuestionStats
  mode: 'locked' | 'scored'
}) {
  const revealed = mode === 'scored'
  const correctIndex = revealed ? question.correctAnswerIndex : null
  const percentages = question.options.map((_, i) => stats?.percentages[i] ?? 0)
  const totalResponses = stats?.totalResponses ?? 0

  return (
    <div className="bg-white rounded-2xl shadow-md border border-pastel-pink-200 p-6 w-full h-full relative overflow-hidden">
      <div className="absolute top-2 right-3 text-base">{revealed ? '✓' : '🔒'}</div>
      {question.category && (
        <p className="text-xs font-medium text-pastel-green-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <span className="text-xs">🌿</span>
          {question.category}
        </p>
      )}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{question.text}</h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="w-28 h-28 shrink-0 self-center sm:self-auto">
          <DonutChart percentages={percentages} myPick={myPick} correctIndex={correctIndex ?? null} />
        </div>

        <div className="flex-1 space-y-2">
          {question.options.map((option, optIdx) => {
            const pct = percentages[optIdx]
            const isMyPick = myPick === optIdx
            const isCorrect = revealed && correctIndex === optIdx
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
                  <span
                    className={`break-words ${
                      isCorrect
                        ? 'font-bold text-green-800'
                        : isWrongPick
                        ? 'text-red-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {option}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {isCorrect && (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                        ✓ Correct
                      </span>
                    )}
                    {isMyPick && (
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                          revealed
                            ? isCorrect
                              ? 'text-green-700 bg-green-100'
                              : 'text-red-700 bg-red-100'
                            : 'text-pink-700 bg-pink-100'
                        }`}
                      >
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

      <p className="text-xs text-gray-400 mt-3">
        {totalResponses} total {totalResponses === 1 ? 'response' : 'responses'}
        {!revealed && ' · correct answer pending'}
      </p>
    </div>
  )
}

/**
 * One question card with three render modes:
 *   open    - pick buttons (autosaves on click)
 *   locked  - donut + your pick highlighted, no correct answer
 *   scored  - donut + correct answer green + your pick green/red
 *
 * Mode-change is animated with a flip-in keyframe (declared globally in index.css).
 * Only the active face is in the DOM so a11y/tests see one card.
 */
export default function QuestionCard({
  question,
  myPick,
  stats,
  onPick,
  saving = false,
}: QuestionCardProps) {
  const mode = modeFor(question)

  return (
    <div
      className="w-full"
      data-testid="question-card"
      data-mode={mode}
      style={{ perspective: '1500px' }}
    >
      <div
        key={mode}
        className="w-full"
        style={{
          animation: 'card-flip-in 700ms ease-out',
          transformOrigin: 'center',
        }}
      >
        {mode === 'open' ? (
          <OpenFace question={question} myPick={myPick} saving={saving} onPick={onPick} />
        ) : (
          <ScoreFace
            question={question}
            myPick={myPick}
            stats={stats}
            mode={mode === 'scored' ? 'scored' : 'locked'}
          />
        )}
      </div>
    </div>
  )
}
