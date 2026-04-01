import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { useGameLock } from './useGameLock'

function gameLockHandler(lock_at: string | null) {
  return http.get('*/rest/v1/game_settings*', () =>
    HttpResponse.json([{ id: 1, lock_at }])
  )
}

describe('useGameLock', () => {
  it('is not locked when lock_at is null', async () => {
    const { result } = renderHook(() => useGameLock())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isLocked).toBe(false)
    expect(result.current.lockAt).toBeNull()
  })

  it('is not locked when lock_at is in the future', async () => {
    const future = new Date(Date.now() + 60_000).toISOString()
    server.use(gameLockHandler(future))

    const { result } = renderHook(() => useGameLock())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isLocked).toBe(false)
    expect(result.current.lockAt).toEqual(new Date(future))
  })

  it('is locked immediately when lock_at is in the past', async () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    server.use(gameLockHandler(past))

    const { result } = renderHook(() => useGameLock())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isLocked).toBe(true)
  })

  it('flips to locked when the deadline passes', async () => {
    // Set the deadline ~100ms away so the real 1-second interval catches it quickly
    const future = new Date(Date.now() + 100).toISOString()
    server.use(gameLockHandler(future))

    const { result } = renderHook(() => useGameLock())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isLocked).toBe(false)

    // The hook's interval fires every 1s — wait for it to flip isLocked
    await waitFor(() => expect(result.current.isLocked).toBe(true), { timeout: 3000 })
  }, 5000)
})
