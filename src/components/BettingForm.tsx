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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-4xl">🎰</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Place Your Bets, {guestName}!</h1>
          <p className="text-gray-500 text-sm mt-1">
            {answeredCount} of {totalCount} questions answered
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 transition-all duration-300"
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
              'w-full py-3 rounded-xl font-semibold text-white transition',
              allAnswered && !isSubmitting
                ? 'bg-pink-500 hover:bg-pink-600'
                : 'bg-gray-300 cursor-not-allowed',
            ].join(' ')}
          >
            {isSubmitting ? 'Submitting…' : 'Submit Predictions'}
          </button>
        </form>
      </div>
    </div>
  )
}
