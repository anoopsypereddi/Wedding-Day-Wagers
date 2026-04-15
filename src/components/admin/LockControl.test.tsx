import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import LockControl from './LockControl'

// Helpers to set up the game_settings GET response
function mockLockAt(lock_at: string | null) {
  server.use(
    http.get('*/rest/v1/game_settings*', () =>
      HttpResponse.json([{ id: 1, lock_at }])
    )
  )
}

function mockUpsertSuccess() {
  server.use(
    http.post('*/rest/v1/game_settings*', () =>
      HttpResponse.json([{ id: 1, lock_at: null }])
    )
  )
}

describe('LockControl', () => {
  it('shows a loading indicator before the fetch resolves', () => {
    // Default handler returns null lock_at; render before fetch resolves
    render(<LockControl />)
    expect(screen.getByText(/loading lock settings/i)).toBeInTheDocument()
  })

  it('shows "Submissions open" when no deadline is set', async () => {
    mockLockAt(null)
    render(<LockControl />)

    await waitFor(() =>
      expect(screen.getByText(/submissions open/i)).toBeInTheDocument()
    )
    expect(screen.getByText(/no deadline set/i)).toBeInTheDocument()
  })

  it('shows "Submissions locked" when the deadline is in the past', async () => {
    mockLockAt(new Date(Date.now() - 60_000).toISOString())
    render(<LockControl />)

    await waitFor(() =>
      expect(screen.getByText(/submissions locked/i)).toBeInTheDocument()
    )
    expect(screen.getByText(/🔒/)).toBeInTheDocument()
  })

  it('shows a countdown when the deadline is in the future', async () => {
    mockLockAt(new Date(Date.now() + 3_600_000).toISOString()) // 1 hour away
    render(<LockControl />)

    await waitFor(() =>
      expect(screen.getByText(/locking in/i)).toBeInTheDocument()
    )
    expect(screen.getByText(/⏳/)).toBeInTheDocument()
  })

  it('disables "Set Deadline" button when the datetime input is empty', async () => {
    mockLockAt(null)
    render(<LockControl />)

    await waitFor(() => expect(screen.getByText(/submissions open/i)).toBeInTheDocument())

    const button = screen.getByRole('button', { name: /set deadline/i })
    expect(button).toBeDisabled()
  })

  it('enables "Set Deadline" and calls upsert when a date is entered', async () => {
    mockLockAt(null)
    mockUpsertSuccess()

    let capturedBody: unknown
    server.use(
      http.post('*/rest/v1/game_settings*', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json([{ id: 1, lock_at: '2026-06-01T12:00:00Z' }])
      })
    )

    render(<LockControl />)
    await waitFor(() => expect(screen.getByText(/submissions open/i)).toBeInTheDocument())

    const input = screen.getByDisplayValue('')
    fireEvent.change(input, { target: { value: '2026-06-01T12:00' } })

    const button = screen.getByRole('button', { name: /set deadline/i })
    expect(button).not.toBeDisabled()

    await userEvent.click(button)

    await waitFor(() => expect(capturedBody).toBeDefined())
    expect(capturedBody).toMatchObject({ id: 1 })
    expect((capturedBody as { lock_at: string }).lock_at).toBeDefined()
  })

  it('does not show the "Clear" button when no deadline is set', async () => {
    mockLockAt(null)
    render(<LockControl />)

    await waitFor(() => expect(screen.getByText(/submissions open/i)).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument()
  })

  it('shows "Clear" button when a deadline exists and calls upsert with null on click', async () => {
    mockLockAt(new Date(Date.now() + 3_600_000).toISOString())

    let capturedBody: unknown
    server.use(
      http.post('*/rest/v1/game_settings*', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json([{ id: 1, lock_at: null }])
      })
    )

    render(<LockControl />)
    await waitFor(() => expect(screen.getByText(/locking in/i)).toBeInTheDocument())

    const clearButton = screen.getByRole('button', { name: /clear/i })
    await userEvent.click(clearButton)

    await waitFor(() => expect(capturedBody).toBeDefined())
    expect((capturedBody as { lock_at: unknown }).lock_at).toBeNull()
  })

  it('displays an error message when the upsert fails', async () => {
    mockLockAt(new Date(Date.now() + 3_600_000).toISOString())
    server.use(
      http.post('*/rest/v1/game_settings*', () =>
        HttpResponse.json({ message: 'permission denied' }, { status: 403 })
      )
    )

    render(<LockControl />)
    await waitFor(() => expect(screen.getByText(/locking in/i)).toBeInTheDocument())

    await userEvent.click(screen.getByRole('button', { name: /clear/i }))

    await waitFor(() =>
      expect(screen.getByText(/permission denied/i)).toBeInTheDocument()
    )
  })
})
