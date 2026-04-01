import { useState } from 'react'
import type { Question } from '../types'
import QuestionCard from './QuestionCard'

interface BettingFormProps {
  questions: Question[]
  guestName: string
  onSubmit: (answers: Record<string, number>) => void
  isSubmitting?: boolean
}

export default function BettingForm({
  questions,
  guestName,
  onSubmit,
  isSubmitting = false,
}: BettingFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const answeredCount = Object.keys(answers).length
  const totalCount = questions.length
  const allAnswered = answeredCount === totalCount

  const handleSelect = (questionId: string, index: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: index }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (allAnswered) onSubmit(answers)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-pink-100 via-white to-pastel-green-100 py-10 px-4 relative">
      {/* Large decorative corner flowers */}
      <div className="fixed top-4 left-4 text-6xl opacity-20 animate-float pointer-events-none">🌸</div>
      <div className="fixed top-4 right-4 text-5xl opacity-15 animate-float-delayed pointer-events-none">🌺</div>
      <div className="fixed bottom-4 left-4 text-5xl opacity-15 animate-float-delayed pointer-events-none">🌿</div>
      <div className="fixed bottom-4 right-4 text-6xl opacity-20 animate-float pointer-events-none">🌸</div>

      <div className="max-w-xl mx-auto relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🌺</span>
            <span className="text-4xl">🎰</span>
            <span className="text-2xl">🌺</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">
            <span className="inline-block mr-1">🌿</span>
            Place Your Bets, {guestName}!
            <span className="inline-block ml-1">🌿</span>
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {answeredCount} of {totalCount} questions answered
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-3 bg-pastel-green-100 rounded-full overflow-hidden border border-pastel-green-200">
            <div
              className="h-full bg-gradient-to-r from-pastel-pink-400 to-pastel-green-400 transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              selectedIndex={answers[q.id] ?? null}
              onSelect={(i) => handleSelect(q.id, i)}
              disabled={isSubmitting}
            />
          ))}

          <button
            type="submit"
            disabled={!allAnswered || isSubmitting}
            className={[
              'w-full py-3 rounded-xl font-semibold text-white transition shadow-md relative overflow-hidden',
              allAnswered && !isSubmitting
                ? 'bg-gradient-to-r from-pastel-pink-400 to-pastel-green-400 hover:from-pastel-pink-500 hover:to-pastel-green-500'
                : 'bg-gray-300 cursor-not-allowed',
            ].join(' ')}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {!isSubmitting && <span>🌸</span>}
              {isSubmitting ? 'Submitting…' : 'Submit Predictions'}
              {!isSubmitting && <span>🌸</span>}
            </span>
            {!isSubmitting && allAnswered && (
              <>
                <span className="absolute top-0 left-4 text-lg opacity-30">✨</span>
                <span className="absolute bottom-0 right-4 text-lg opacity-30">✨</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
