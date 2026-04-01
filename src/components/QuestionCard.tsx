import type { Question } from '../types'

interface QuestionCardProps {
  question: Question
  selectedIndex: number | null
  onSelect: (index: number) => void
  disabled?: boolean
}

export default function QuestionCard({
  question,
  selectedIndex,
  onSelect,
  disabled = false,
}: QuestionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full">
      <p className="text-xs font-medium text-pink-500 uppercase tracking-wide mb-1">
        {question.category}
      </p>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{question.text}</h2>

      <div className="space-y-2">
        {question.options.map((option, i) => {
          const isSelected = selectedIndex === i
          return (
            <button
              key={i}
              onClick={() => !disabled && onSelect(i)}
              disabled={disabled}
              className={[
                'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition',
                isSelected
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-pink-300 hover:bg-pink-50',
                disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer',
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
