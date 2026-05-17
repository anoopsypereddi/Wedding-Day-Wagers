import { renderHook, act } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { useGuest } from './useGuest'
import { GUEST } from '../test/handlers'

describe('useGuest', () => {
  it('returns existing guest when phone matches', async () => {
    server.use(
      // maybeSingle() — return a single object (PostgREST object response)
      http.get('*/rest/v1/guests*', () => HttpResponse.json(GUEST))
    )

    const { result } = renderHook(() => useGuest())
    let guest
    await act(async () => {
      guest = await result.current.findOrCreateGuest('Alice', '555-123-4567')
    })
    expect(guest).toEqual(GUEST)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('creates a new guest when phone is not found', async () => {
    server.use(
      // maybeSingle() with no result → null
      http.get('*/rest/v1/guests*', () => HttpResponse.json(null)),
      // insert + single() → single object
      http.post('*/rest/v1/guests*', () => HttpResponse.json(GUEST))
    )

    const { result } = renderHook(() => useGuest())
    let guest
    await act(async () => {
      guest = await result.current.findOrCreateGuest('Alice', '555-123-4567')
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
      guest = await result.current.findOrCreateGuest('Alice', '555-123-4567')
    })
    expect(guest).toEqual(GUEST)
  })

  it('throws for empty name without hitting Supabase', async () => {
    const { result } = renderHook(() => useGuest())
    await act(async () => {
      await expect(result.current.findOrCreateGuest('  ', '555-123-4567')).rejects.toThrow(
        'Guest name cannot be empty'
      )
    })
    // Error is thrown before the try/catch so loading stays false
    expect(result.current.loading).toBe(false)
  })

  it('throws for invalid phone without hitting Supabase', async () => {
    const { result } = renderHook(() => useGuest())
    await act(async () => {
      await expect(result.current.findOrCreateGuest('Alice', '12345')).rejects.toThrow(
        'Please enter a valid phone number'
      )
    })
    expect(result.current.loading).toBe(false)
  })
})
