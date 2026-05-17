import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'
import { GUEST, QUESTIONS, SUBMISSIONS } from '../../test/handlers'

describe('Per-question lock', () => {
  it('renders a locked question in score mode while leaving open ones interactive', async () => {
    const lockedQuestions = [
      { ...QUESTIONS[0], locked_at: '2026-01-01T00:00:00Z' }, // q1 locked, not revealed
      QUESTIONS[1], // q2 still open
    ]

    server.use(
      http.get('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),
      http.get('*/rest/v1/questions*', () => HttpResponse.json(lockedQuestions)),
      http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
    )

    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-123-4567')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))

    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    const cards = screen.getAllByTestId('question-card')
    expect(cards[0].dataset.mode).toBe('locked')
    expect(cards[1].dataset.mode).toBe('open')
    expect(screen.getByText(/correct answer pending/i)).toBeInTheDocument()
  })

  it('renders a revealed question in scored mode', async () => {
    const scoredQuestions = [
      { ...QUESTIONS[0], locked_at: '2026-01-01T00:00:00Z', correct_answer_index: 1 },
      QUESTIONS[1],
    ]

    server.use(
      http.get('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),
      http.get('*/rest/v1/questions*', () => HttpResponse.json(scoredQuestions)),
      http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
    )

    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-123-4567')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))

    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    const cards = screen.getAllByTestId('question-card')
    expect(cards[0].dataset.mode).toBe('scored')
    expect(screen.getAllByText(/✓ Correct/).length).toBeGreaterThan(0)
  })

  it('redirects /questions and /results to /game', async () => {
    server.use(
      http.get('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),
      http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
    )

    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-123-4567')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Wedding Wagers/)).toBeInTheDocument())
  })
})
