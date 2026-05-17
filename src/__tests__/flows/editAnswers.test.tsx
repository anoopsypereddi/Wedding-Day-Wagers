import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'
import { GUEST, SUBMISSIONS } from '../../test/handlers'

describe('Edit answer flow (autosave)', () => {
  beforeEach(() => {
    server.use(
      http.get('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),
      http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
    )
  })

  it('autosaves immediately when a returning guest changes a pick', async () => {
    const upsertSpy = vi.fn()
    server.use(
      http.post('*/rest/v1/submissions*', async ({ request }) => {
        upsertSpy(await request.json())
        return HttpResponse.json(SUBMISSIONS)
      }),
    )

    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    // Change q1 from Bride (0) to Groom (1)
    await userEvent.click(screen.getByText('Groom'))

    await waitFor(() => expect(upsertSpy).toHaveBeenCalled())
    const body = upsertSpy.mock.calls[0][0] as {
      question_id: string
      selected_option_index: number
    }
    expect(body.question_id).toBe('q1')
    expect(body.selected_option_index).toBe(1)
  })

  it('does not re-upsert when clicking the already-selected option', async () => {
    const upsertSpy = vi.fn()
    server.use(
      http.post('*/rest/v1/submissions*', async ({ request }) => {
        upsertSpy(await request.json())
        return HttpResponse.json(SUBMISSIONS)
      }),
    )

    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    // q1's server value is 0 (Bride) — clicking Bride again should be a no-op
    await userEvent.click(screen.getByText('Bride'))
    // Give any pending request a moment
    await new Promise((r) => setTimeout(r, 50))
    expect(upsertSpy).not.toHaveBeenCalled()
  })
})
