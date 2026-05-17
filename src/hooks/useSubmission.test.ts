import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { useSubmission } from './useSubmission'
import { GUEST, SUBMISSIONS } from '../test/handlers'

const GUEST_ID = GUEST.id
const ANSWERS = { q1: 0, q2: 2 }

describe('useSubmission', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useSubmission())
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('returns true on a happy-path batch submit', async () => {
    const { result } = renderHook(() => useSubmission())
    let ok = false
    await act(async () => {
      ok = await result.current.submitAnswers(GUEST_ID, ANSWERS)
    })
    expect(ok).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('sends one row per answer with the right fields', async () => {
    let body: unknown
    server.use(
      http.post('*/rest/v1/submissions*', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(SUBMISSIONS)
      }),
    )

    const { result } = renderHook(() => useSubmission())
    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, { q1: 0, q2: 2 })
    })

    expect(body).toEqual(
      expect.arrayContaining([
        { guest_id: GUEST_ID, question_id: 'q1', selected_option_index: 0 },
        { guest_id: GUEST_ID, question_id: 'q2', selected_option_index: 2 },
      ]),
    )
  })

  it('skips the request entirely when no answers are passed', async () => {
    let upsertCalled = false
    server.use(
      http.post('*/rest/v1/submissions*', () => {
        upsertCalled = true
        return HttpResponse.json([])
      }),
    )

    const { result } = renderHook(() => useSubmission())
    let ok = false
    await act(async () => {
      ok = await result.current.submitAnswers(GUEST_ID, {})
    })
    expect(ok).toBe(true)
    expect(upsertCalled).toBe(false)
  })

  it('tracks loading while the upsert is in-flight', async () => {
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
      void result.current.submitAnswers(GUEST_ID, ANSWERS)
    })

    await waitFor(() => expect(result.current.loading).toBe(true))
    await act(async () => resolveUpsert())
    expect(result.current.loading).toBe(false)
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
      ok = await result.current.submitAnswers(GUEST_ID, ANSWERS)
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
      await result.current.submitAnswers(GUEST_ID, ANSWERS)
    })
    expect(result.current.error).not.toBeNull()

    server.use(
      http.post('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),
    )
    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, ANSWERS)
    })
    expect(result.current.error).toBeNull()
  })
})
