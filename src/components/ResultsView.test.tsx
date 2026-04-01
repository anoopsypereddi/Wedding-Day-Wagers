import { render, screen } from '@testing-library/react'
import ResultsView from './ResultsView'
import type { Question, QuestionStats } from '../types'

const QUESTION: Question = {
  id: 'q1',
  text: 'Who will cry first?',
  options: ['Bride', 'Groom', 'Both'],
  category: 'Ceremony',
  correctAnswerIndex: -1,
  displayOrder: 1,
  isActive: true,
}

const STATS: QuestionStats = {
  questionId: 'q1',
  optionCounts: [10, 5, 5],
  totalResponses: 20,
  percentages: [50, 25, 25],
}

describe('ResultsView', () => {
  it('renders the question text and all options', () => {
    render(<ResultsView questions={[QUESTION]} stats={[STATS]} />)
    expect(screen.getByText('Who will cry first?')).toBeInTheDocument()
    for (const opt of QUESTION.options) {
      expect(screen.getByText(opt)).toBeInTheDocument()
    }
  })

  it('shows percentages for each option', () => {
    render(<ResultsView questions={[QUESTION]} stats={[STATS]} />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('does not show correct label when answers are not revealed (correctAnswerIndex = -1)', () => {
    render(<ResultsView questions={[QUESTION]} stats={[STATS]} />)
    expect(screen.queryByText(/✓ correct/i)).not.toBeInTheDocument()
  })

  it('shows "✓ correct" label when correctAnswerIndex is set', () => {
    const revealed: Question = { ...QUESTION, correctAnswerIndex: 0 }
    render(<ResultsView questions={[revealed]} stats={[STATS]} />)
    expect(screen.getByText(/✓ correct/i)).toBeInTheDocument()
  })

  it('marks the guest\'s pick with "(your pick)"', () => {
    render(
      <ResultsView
        questions={[QUESTION]}
        stats={[STATS]}
        guestAnswers={{ q1: 1 }}
      />
    )
    expect(screen.getByText('(your pick)')).toBeInTheDocument()
  })

  it('shows both correct label and your pick when guest picked correctly', () => {
    const revealed: Question = { ...QUESTION, correctAnswerIndex: 0 }
    render(
      <ResultsView
        questions={[revealed]}
        stats={[STATS]}
        guestAnswers={{ q1: 0 }}
      />
    )
    expect(screen.getByText(/✓ correct/i)).toBeInTheDocument()
    expect(screen.getByText('(your pick)')).toBeInTheDocument()
  })

  it('renders total responses count', () => {
    render(<ResultsView questions={[QUESTION]} stats={[STATS]} />)
    expect(screen.getByText(/20 total responses/i)).toBeInTheDocument()
  })
})
