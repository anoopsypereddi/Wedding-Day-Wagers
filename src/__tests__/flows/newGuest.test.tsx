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
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-123-4567')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))

    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())
    expect(screen.getByText(/How long will the first dance/)).toBeInTheDocument()
    expect(screen.getByText(/Wedding Wagers/)).toBeInTheDocument()
  })

  it('autosaves a pick immediately when clicked', async () => {
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
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-123-4567')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    await userEvent.click(screen.getByText('Groom'))

    await waitFor(() => expect(upsertSpy).toHaveBeenCalledTimes(1))
    const body = upsertSpy.mock.calls[0][0] as {
      question_id: string
      selected_option_index: number
    }
    expect(body.question_id).toBe('q1')
    expect(body.selected_option_index).toBe(1)
  })

  it('writes one upsert per question clicked', async () => {
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
    await userEvent.type(screen.getByLabelText(/phone number/i), '555-123-4567')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    await userEvent.click(screen.getByText('Groom'))
    await waitFor(() => expect(upsertSpy).toHaveBeenCalledTimes(1))

    await userEvent.click(screen.getByText('Under 3 min'))
    await waitFor(() => expect(upsertSpy).toHaveBeenCalledTimes(2))
  })
})
