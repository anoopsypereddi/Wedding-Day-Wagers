import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'
import { SUBMISSIONS } from '../../test/handlers'

describe('New guest flow', () => {
  function setupNewGuest() {
    server.use(
      http.get('*/rest/v1/submissions*', () => HttpResponse.json([])),
    )
  }

  it('routes to /game after login and shows all open questions', async () => {
    setupNewGuest()
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))

    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())
    expect(screen.getByText(/How long will the first dance/)).toBeInTheDocument()
    expect(screen.getByText(/Wedding Wagers/)).toBeInTheDocument()
  })

  it('submit button stays disabled until a pick is made', async () => {
    setupNewGuest()
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    expect(screen.getByRole('button', { name: /all picks saved/i })).toBeDisabled()
  })

  it('batches picks into a single submit request', async () => {
    setupNewGuest()
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

    // Make two picks locally — no network calls yet
    await userEvent.click(screen.getByText('Groom'))
    await userEvent.click(screen.getByText('Under 3 min'))
    expect(upsertSpy).not.toHaveBeenCalled()

    // Submit — one batched call
    await userEvent.click(screen.getByRole('button', { name: /submit 2 picks/i }))
    await waitFor(() => expect(upsertSpy).toHaveBeenCalledTimes(1))
    const body = upsertSpy.mock.calls[0][0] as {
      question_id: string
      selected_option_index: number
    }[]
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ question_id: 'q1', selected_option_index: 1 }),
        expect.objectContaining({ question_id: 'q2', selected_option_index: 0 }),
      ]),
    )
  })
})
