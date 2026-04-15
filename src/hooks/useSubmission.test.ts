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
    expect(result.current.success).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets success after a happy-path submission', async () => {
    const { result } = renderHook(() => useSubmission())

    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, ANSWERS)
    })

    expect(result.current.success).toBe(true)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sends the correct rows to the upsert endpoint', async () => {
    let capturedBody: unknown
    server.use(
      http.post('*/rest/v1/submissions*', async ({ request }) => {
        capturedBody = await request.json()
        return HttpResponse.json(SUBMISSIONS)
      })
    )

    const { result } = renderHook(() => useSubmission())
    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, { q1: 0, q2: 2 })
    })

    expect(capturedBody).toEqual(
      expect.arrayContaining([
        { guest_id: GUEST_ID, question_id: 'q1', selected_option_index: 0 },
        { guest_id: GUEST_ID, question_id: 'q2', selected_option_index: 2 },
      ])
    )
  })

  it('tracks loading: true while the request is in-flight, false on completion', async () => {
    let resolveUpsert!: () => void
    server.use(
      http.post('*/rest/v1/submissions*', () =>
        new Promise(resolve => {
          resolveUpsert = () => resolve(HttpResponse.json(SUBMISSIONS))
        })
      )
    )

    const { result } = renderHook(() => useSubmission())
    expect(result.current.loading).toBe(false)

    // Start the submission without blocking on it
    act(() => {
      void result.current.submitAnswers(GUEST_ID, ANSWERS)
    })

    await waitFor(() => expect(result.current.loading).toBe(true))

    await act(async () => resolveUpsert())
    expect(result.current.loading).toBe(false)
    expect(result.current.success).toBe(true)
  })

  it('sets error when the submission upsert fails', async () => {
    server.use(
      http.post('*/rest/v1/submissions*', () =>
        HttpResponse.json({ message: 'insert failed' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useSubmission())
    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, ANSWERS)
    })

    expect(result.current.success).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toMatch(/insert failed/i)
  })

  it('sets error when the guest last_viewed_at update fails', async () => {
    server.use(
      http.patch('*/rest/v1/guests*', () =>
        HttpResponse.json({ message: 'update failed' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useSubmission())
    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, ANSWERS)
    })

    expect(result.current.success).toBe(false)
    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('does not call Supabase and leaves success false when answers is empty', async () => {
    let upsertCalled = false
    server.use(
      http.post('*/rest/v1/submissions*', () => {
        upsertCalled = true
        return HttpResponse.json(SUBMISSIONS)
      })
    )

    const { result } = renderHook(() => useSubmission())
    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, {})
    })

    expect(upsertCalled).toBe(false)
    expect(result.current.success).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('resets error and success state on a subsequent call', async () => {
    // First call: fails
    server.use(
      http.post('*/rest/v1/submissions*', () =>
        HttpResponse.json({ message: 'insert failed' }, { status: 500 })
      )
    )

    const { result } = renderHook(() => useSubmission())
    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, ANSWERS)
    })
    expect(result.current.error).not.toBeNull()
    expect(result.current.success).toBe(false)

    // Second call: succeeds (override takes precedence)
    server.use(
      http.post('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS))
    )

    await act(async () => {
      await result.current.submitAnswers(GUEST_ID, ANSWERS)
    })
    expect(result.current.error).toBeNull()
    expect(result.current.success).toBe(true)
  })
})
