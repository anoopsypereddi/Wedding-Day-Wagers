import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { useResults } from './useResults'

const QUESTIONS_STUB = [
  { id: 'q1', options: ['A', 'B', 'C'], is_active: true },
  { id: 'q2', options: ['X', 'Y'], is_active: true },
]

describe('useResults', () => {
  beforeEach(() => {
    server.use(
      http.get('*/rest/v1/questions*', () => HttpResponse.json(QUESTIONS_STUB))
    )
  })

  it('computes percentages correctly', async () => {
    // 2 votes for q1-A, 1 vote for q1-B → 66.67% / 33.33%
    server.use(
      http.get('*/rest/v1/submissions*', () =>
        HttpResponse.json([
          { question_id: 'q1', selected_option_index: 0 },
          { question_id: 'q1', selected_option_index: 0 },
          { question_id: 'q1', selected_option_index: 1 },
        ])
      )
    )

    const { result } = renderHook(() => useResults(null))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const q1 = result.current.stats.find((s) => s.questionId === 'q1')!
    expect(q1.totalResponses).toBe(3)
    expect(q1.optionCounts).toEqual([2, 1, 0])
    expect(parseFloat(q1.percentages[0].toFixed(2))).toBeCloseTo(66.67, 1)
    expect(parseFloat(q1.percentages[1].toFixed(2))).toBeCloseTo(33.33, 1)
    expect(q1.percentages[2]).toBe(0)
  })

  it('handles zero total responses without NaN', async () => {
    server.use(
      http.get('*/rest/v1/submissions*', () => HttpResponse.json([]))
    )

    const { result } = renderHook(() => useResults(null))
    await waitFor(() => expect(result.current.loading).toBe(false))

    for (const stat of result.current.stats) {
      for (const pct of stat.percentages) {
        expect(pct).toBe(0)
        expect(Number.isNaN(pct)).toBe(false)
      }
    }
  })

  it('maps snake_case DB columns to camelCase Submission type', async () => {
    server.use(
      http.get('*/rest/v1/submissions*', () =>
        HttpResponse.json([
          {
            id: 's1',
            guest_id: 'guest-1',
            question_id: 'q1',
            selected_option_index: 0,
            created_at: '2024-01-01T00:00:00Z',
          },
        ])
      )
    )

    const { result } = renderHook(() => useResults('guest-1'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    const sub = result.current.guestSubmissions[0]
    expect(sub.guestId).toBe('guest-1')
    expect(sub.questionId).toBe('q1')
    expect(sub.selectedOptionIndex).toBe(0)
    expect(sub.createdAt).toBe('2024-01-01T00:00:00Z')
  })

  it('leaves guestSubmissions empty when guestId is null', async () => {
    server.use(
      http.get('*/rest/v1/submissions*', () => HttpResponse.json([]))
    )
    const { result } = renderHook(() => useResults(null))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.guestSubmissions).toEqual([])
  })
})
