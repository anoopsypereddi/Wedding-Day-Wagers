import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'
import { GUEST, SUBMISSIONS, QUESTIONS } from '../../test/handlers'

function setupReturningGuest() {
  server.use(
    http.get('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),
    http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
    http.head('*/rest/v1/submissions*', () =>
      new HttpResponse(null, { headers: { 'Content-Range': '0-1/2' } })
    )
  )
}

describe('Lock enforcement', () => {
  describe('global timer lock', () => {
    it('hides Edit answers when lock_at is in the past', async () => {
      setupReturningGuest()
      server.use(
        http.get('*/rest/v1/game_settings*', () =>
          HttpResponse.json([{ id: 1, lock_at: new Date(Date.now() - 1000).toISOString() }])
        )
      )

      renderApp('/')
      await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
      await userEvent.click(screen.getByRole('button', { name: /let's play/i }))

      // Wait for the fully-loaded results page (not just the "Loading results…" spinner)
      await waitFor(() => expect(screen.getByText(/🔒 Locked/)).toBeInTheDocument())
      expect(screen.queryByRole('button', { name: /edit answers/i })).not.toBeInTheDocument()
    })

    it('redirects /questions to /results when locked', async () => {
      setupReturningGuest()
      server.use(
        http.get('*/rest/v1/game_settings*', () =>
          HttpResponse.json([{ id: 1, lock_at: new Date(Date.now() - 1000).toISOString() }])
        )
      )

      renderApp('/questions')
      await waitFor(() => expect(screen.getByText(/see how everyone voted/i)).toBeInTheDocument())
    })
  })

  describe('answers revealed lock', () => {
    it('hides Edit answers when any question has a revealed answer', async () => {
      setupReturningGuest()
      server.use(
        http.get('*/rest/v1/questions*', () =>
          HttpResponse.json(
            QUESTIONS.map((q, i) => ({ ...q, correct_answer_index: i === 0 ? 0 : -1 }))
          )
        )
      )

      renderApp('/')
      await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
      await userEvent.click(screen.getByRole('button', { name: /let's play/i }))

      await waitFor(() => expect(screen.getByText(/🔒 Locked/)).toBeInTheDocument())
      expect(screen.queryByRole('button', { name: /edit answers/i })).not.toBeInTheDocument()
    })

    it('shows ✓ correct badge on the revealed answer', async () => {
      setupReturningGuest()
      server.use(
        http.get('*/rest/v1/questions*', () =>
          HttpResponse.json(
            QUESTIONS.map((q, i) => ({ ...q, correct_answer_index: i === 0 ? 0 : -1 }))
          )
        )
      )

      renderApp('/results')
      await waitFor(() => expect(screen.getByText(/✓ Correct/i)).toBeInTheDocument())
    })
  })
})
