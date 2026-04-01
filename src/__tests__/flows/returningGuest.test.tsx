import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'
import { GUEST, SUBMISSIONS } from '../../test/handlers'

describe('Returning guest flow', () => {
  beforeEach(() => {
    server.use(
      http.get('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),
      http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
      http.head('*/rest/v1/submissions*', () =>
        new HttpResponse(null, { headers: { 'Content-Range': '0-1/2' } })
      )
    )
  })

  it('routes directly to /results skipping /questions', async () => {
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/results/i)).toBeInTheDocument())
    expect(screen.queryByText(/make your predictions/i)).not.toBeInTheDocument()
  })

  it('shows the Edit answers button when game is not locked', async () => {
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /edit answers/i })).toBeInTheDocument()
    )
  })
})
