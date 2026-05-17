import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionCard from './QuestionCard'
import type { Question, QuestionStats } from '../types'

const BASE: Question = {
  id: 'q1',
  text: 'Who will cry first?',
  options: ['Bride', 'Groom', 'Both', 'Neither'],
  category: 'Ceremony',
  correctAnswerIndex: null,
  lockedAt: null,
  displayOrder: 1,
  isActive: true,
}

const STATS: QuestionStats = {
  questionId: 'q1',
  optionCounts: [2, 1, 0, 0],
  totalResponses: 3,
  percentages: [66, 33, 0, 0],
}

describe('QuestionCard', () => {
  it('renders question text and all options in open mode', () => {
    render(<QuestionCard question={BASE} myPick={null} onPick={vi.fn()} />)
    expect(screen.getByText('Who will cry first?')).toBeInTheDocument()
    for (const opt of BASE.options) {
      expect(screen.getByText(opt)).toBeInTheDocument()
    }
    expect(screen.getByTestId('question-card').dataset.mode).toBe('open')
  })

  it('calls onPick with the option index when an open option is clicked', async () => {
    const onPick = vi.fn()
    render(<QuestionCard question={BASE} myPick={null} onPick={onPick} />)
    await userEvent.click(screen.getByText('Groom'))
    expect(onPick).toHaveBeenCalledWith(1)
  })

  it('does not call onPick while saving (button disabled)', async () => {
    const onPick = vi.fn()
    render(<QuestionCard question={BASE} myPick={null} onPick={onPick} saving />)
    await userEvent.click(screen.getByText('Bride'))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('flips to locked mode when question has lockedAt', () => {
    const locked: Question = { ...BASE, lockedAt: '2026-01-01T00:00:00Z' }
    render(<QuestionCard question={locked} myPick={0} stats={STATS} onPick={vi.fn()} />)
    expect(screen.getByTestId('question-card').dataset.mode).toBe('locked')
    expect(screen.getByText(/correct answer pending/i)).toBeInTheDocument()
  })

  it('shows correct/wrong styling in scored mode', () => {
    const scored: Question = { ...BASE, lockedAt: '2026-01-01T00:00:00Z', correctAnswerIndex: 1 }
    render(<QuestionCard question={scored} myPick={0} stats={STATS} onPick={vi.fn()} />)
    expect(screen.getByTestId('question-card').dataset.mode).toBe('scored')
    expect(screen.getByText(/✓ Correct/)).toBeInTheDocument()
  })
})
