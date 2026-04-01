import { renderHook, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { useGuest } from './useGuest'
import { GUEST } from '../test/handlers'

describe('useGuest', () => {
  it('returns existing guest when name matches', async () => {
    server.use(
      // maybeSingle() — return a single object (PostgREST object response)
      http.get('*/rest/v1/guests*', () => HttpResponse.json(GUEST))
    )

    const { result } = renderHook(() => useGuest())
    let guest
    await act(async () => {
      guest = await result.current.findOrCreateGuest('Alice')
    })
    expect(guest).toEqual(GUEST)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('creates a new guest when name is not found', async () => {
    server.use(
      // maybeSingle() with no result → null
      http.get('*/rest/v1/guests*', () => HttpResponse.json(null)),
      // insert + single() → single object
      http.post('*/rest/v1/guests*', () => HttpResponse.json(GUEST))
    )

    const { result } = renderHook(() => useGuest())
    let guest
    await act(async () => {
      guest = await result.current.findOrCreateGuest('Alice')
    })
    expect(guest).toEqual(GUEST)
  })

  it('retries on 23505 race condition', async () => {
    let getCount = 0
    server.use(
      http.get('*/rest/v1/guests*', () => {
        getCount++
        // First GET: not found; retry GET: found
        return getCount === 1 ? HttpResponse.json(null) : HttpResponse.json(GUEST)
      }),
      http.post('*/rest/v1/guests*', () =>
        HttpResponse.json({ code: '23505', message: 'duplicate key' }, { status: 409 })
      )
    )

    const { result } = renderHook(() => useGuest())
    let guest
    await act(async () => {
      guest = await result.current.findOrCreateGuest('Alice')
    })
    expect(guest).toEqual(GUEST)
  })

  it('throws for empty name without hitting Supabase', async () => {
    const { result } = renderHook(() => useGuest())
    await act(async () => {
      await expect(result.current.findOrCreateGuest('  ')).rejects.toThrow(
        'Guest name cannot be empty'
      )
    })
    // Error is thrown before the try/catch so loading stays false
    expect(result.current.loading).toBe(false)
  })
})
