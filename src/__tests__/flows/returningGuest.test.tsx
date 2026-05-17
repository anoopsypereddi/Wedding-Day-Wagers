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
    )
  })

  it('lands on /game and pre-selects existing picks on open cards', async () => {
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-123-4567')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))

    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    // SUBMISSIONS has q1 = 0 (Bride). The Bride button should carry the pink-pick class.
    const brideButton = screen.getByText('Bride').closest('button')!
    expect(brideButton.className).toMatch(/pink/)
  })
})
