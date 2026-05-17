import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { useSubmission } from './useSubmission'
import { GUEST, SUBMISSIONS } from '../test/handlers'

const GUEST_ID = GUEST.id

describe('useSubmission', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useSubmission())
    expect(result.current.savingId).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('returns true on a happy-path upsert', async () => {
    const { result } = renderHook(() => useSubmission())
    let ok = false
    await act(async () => {
      ok = await result.current.upsertAnswer(GUEST_ID, 'q1', 0)
    })
    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('sends a single row with the right fields', async () => {
    let body: unknown
    server.use(
      http.post('*/rest/v1/submissions*', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(SUBMISSIONS)
      }),
    )

    const { result } = renderHook(() => useSubmission())
    await act(async () => {
      await result.current.upsertAnswer(GUEST_ID, 'q1', 2)
    })

    expect(body).toEqual({ guest_id: GUEST_ID, question_id: 'q1', selected_option_index: 2 })
  })

  it('tracks savingId while the upsert is in-flight', async () => {
    let resolveUpsert!: () => void
    server.use(
      http.post(
        '*/rest/v1/submissions*',
        () =>
          new Promise((resolve) => {
            resolveUpsert = () => resolve(HttpResponse.json(SUBMISSIONS))
          }),
      ),
    )

    const { result } = renderHook(() => useSubmission())
    act(() => {
      void result.current.upsertAnswer(GUEST_ID, 'q1', 0)
    })

    await waitFor(() => expect(result.current.savingId).toBe('q1'))
    await act(async () => resolveUpsert())
    expect(result.current.savingId).toBeNull()
  })

  it('returns false and sets error on upsert failure', async () => {
    server.use(
      http.post('*/rest/v1/submissions*', () =>
        HttpResponse.json({ message: 'insert failed' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useSubmission())
    let ok = true
    await act(async () => {
      ok = await result.current.upsertAnswer(GUEST_ID, 'q1', 0)
    })

    expect(ok).toBe(false)
    expect(result.current.error?.message).toMatch(/insert failed/i)
  })

  it('clears prior error on a subsequent successful call', async () => {
    server.use(
      http.post('*/rest/v1/submissions*', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 }),
      ),
    )

    const { result } = renderHook(() => useSubmission())
    await act(async () => {
      await result.current.upsertAnswer(GUEST_ID, 'q1', 0)
    })
    expect(result.current.error).not.toBeNull()

    server.use(
      http.post('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
    )
    await act(async () => {
      await result.current.upsertAnswer(GUEST_ID, 'q1', 0)
    })
    expect(result.current.error).toBeNull()
  })
})
