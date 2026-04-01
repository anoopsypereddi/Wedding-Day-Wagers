import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'
import { GUEST, SUBMISSIONS } from '../../test/handlers'

describe('Edit answers flow', () => {
  beforeEach(() => {
    server.use(
      http.get('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),
      http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
      http.head('*/rest/v1/submissions*', () =>
        new HttpResponse(null, { headers: { 'Content-Range': '0-1/2' } })
      )
    )
  })

  it('pre-populates question cards with previous answers', async () => {
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /edit answers/i })).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /edit answers/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    // SUBMISSIONS has q1=index 0 (Bride) and q2=index 2 (Over 5 min) — all answered
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /submit predictions/i })).not.toBeDisabled()
    )
  })

  it('allows changing one answer and re-submitting', async () => {
    const upsertSpy = vi.fn()
    server.use(
      http.post('*/rest/v1/submissions*', async ({ request }) => {
        upsertSpy(await request.json())
        return HttpResponse.json(SUBMISSIONS)
      })
    )

    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /edit answers/i })).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /edit answers/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    // Change q1 from Bride (0) to Groom (1)
    await userEvent.click(screen.getByText('Groom'))
    await userEvent.click(screen.getByRole('button', { name: /submit predictions/i }))

    await waitFor(() => expect(upsertSpy).toHaveBeenCalled())
    const body = upsertSpy.mock.calls[0][0] as { question_id: string; selected_option_index: number }[]
    const q1Answer = body.find((r) => r.question_id === 'q1')
    expect(q1Answer?.selected_option_index).toBe(1)
  })
})
