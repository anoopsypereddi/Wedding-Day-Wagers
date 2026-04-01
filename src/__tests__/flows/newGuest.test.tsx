import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/renderApp'

describe('New guest flow', () => {
  function setupNewGuest() {
    server.use(
      http.get('*/rest/v1/submissions*', ({ request }) => {
        if (request.headers.get('Prefer')?.includes('count')) {
          return new HttpResponse(null, { headers: { 'Content-Range': '0-0/0' } })
        }
        return HttpResponse.json([])
      })
    )
  }

  it('routes to /questions after a first-time login', async () => {
    setupNewGuest()
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() =>
      expect(screen.getByText(/make your predictions/i)).toBeInTheDocument()
    )
  })

  it('shows all questions on the questions page', async () => {
    setupNewGuest()
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())
    expect(screen.getByText(/How long will the first dance/)).toBeInTheDocument()
  })

  it('submit button is disabled until all questions are answered', async () => {
    setupNewGuest()
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    const submit = screen.getByRole('button', { name: /0 \/ 2 answered/i })
    expect(submit).toBeDisabled()

    await userEvent.click(screen.getByText('Bride'))
    expect(screen.getByRole('button', { name: /1 \/ 2 answered/i })).toBeDisabled()
  })

  it('navigates to /results after submitting all answers', async () => {
    setupNewGuest()
    renderApp('/')
    await userEvent.type(await screen.findByPlaceholderText(/your name/i), 'Alice')
    await userEvent.click(screen.getByRole('button', { name: /let's play/i }))
    await waitFor(() => expect(screen.getByText(/Who will cry first/)).toBeInTheDocument())

    await userEvent.click(screen.getByText('Bride'))
    await userEvent.click(screen.getByText('Under 3 min'))
    await userEvent.click(screen.getByRole('button', { name: /submit predictions/i }))

    await waitFor(() => expect(screen.getByText(/results/i)).toBeInTheDocument())
  })
})
