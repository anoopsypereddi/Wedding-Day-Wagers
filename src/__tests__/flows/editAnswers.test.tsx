import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'
import { GUEST, SUBMISSIONS } from '../../test/handlers'

describe('Edit answer flow', () => {
  beforeEach(() => {
    server.use(
      http.get('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),
      http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
    )
  })

  it('writes only the changed pick when a returning guest submits', async () => {
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

    // Change q1 from Bride (0) to Groom (1). q2 stays at its server value.
    await userEvent.click(screen.getByText('Groom'))

    expect(upsertSpy).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: /submit 1 pick/i }))

    await waitFor(() => expect(upsertSpy).toHaveBeenCalled())
    const body = upsertSpy.mock.calls[0][0] as {
      question_id: string
      selected_option_index: number
    }[]
    expect(body).toHaveLength(1)
    expect(body[0].question_id).toBe('q1')
    expect(body[0].selected_option_index).toBe(1)
  })
})
