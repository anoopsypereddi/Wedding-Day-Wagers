import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionCard from './QuestionCard'
import type { Question } from '../types'

const Q: Question = {
  id: 'q1',
  text: 'Who will cry first?',
  options: ['Bride', 'Groom', 'Both', 'Neither'],
  category: 'Ceremony',
  correctAnswerIndex: -1,
  displayOrder: 1,
  isActive: true,
}

describe('QuestionCard', () => {
  it('renders the question text and all options', () => {
    render(<QuestionCard question={Q} selectedIndex={null} onSelect={vi.fn()} />)
    expect(screen.getByText('Who will cry first?')).toBeInTheDocument()
    for (const opt of Q.options) {
      expect(screen.getByText(opt)).toBeInTheDocument()
    }
  })

  it('calls onSelect with the correct index when an option is clicked', async () => {
    const onSelect = vi.fn()
    render(<QuestionCard question={Q} selectedIndex={null} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('Groom'))
    expect(onSelect).toHaveBeenCalledWith(1)
  })

  it('applies selected styling to the chosen option', () => {
    render(<QuestionCard question={Q} selectedIndex={2} onSelect={vi.fn()} />)
    const bothButton = screen.getByText('Both').closest('button')!
    expect(bothButton.className).toMatch(/pink/)
  })

  it('does not call onSelect when disabled', async () => {
    const onSelect = vi.fn()
    render(<QuestionCard question={Q} selectedIndex={null} onSelect={onSelect} disabled />)
    await userEvent.click(screen.getByText('Bride'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
