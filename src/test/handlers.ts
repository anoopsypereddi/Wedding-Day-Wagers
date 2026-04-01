import { http, HttpResponse } from 'msw'

// ---------------------------------------------------------------------------
// Shared fixture data
// ---------------------------------------------------------------------------

export const GUEST = { id: 'guest-1', name: 'Alice' }

export const QUESTIONS = [
  {
    id: 'q1',
    text: 'Who will cry first?',
    options: ['Bride', 'Groom', 'Both', 'Neither'],
    category: 'Ceremony',
    correct_answer_index: -1,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'q2',
    text: 'How long will the first dance be?',
    options: ['Under 3 min', '3–5 min', 'Over 5 min'],
    category: 'Reception',
    correct_answer_index: -1,
    display_order: 2,
    is_active: true,
  },
]

export const SUBMISSIONS = [
  { id: 's1', guest_id: 'guest-1', question_id: 'q1', selected_option_index: 0, created_at: '2024-01-01T00:00:00Z' },
  { id: 's2', guest_id: 'guest-1', question_id: 'q2', selected_option_index: 2, created_at: '2024-01-01T00:00:00Z' },
]

// ---------------------------------------------------------------------------
// Default handlers — override per-test with server.use(...)
// ---------------------------------------------------------------------------

export const handlers = [
  // game_settings — unlocked by default
  http.get('*/rest/v1/game_settings*', () =>
    HttpResponse.json([{ id: 1, lock_at: null }])
  ),

  // guests — no existing guest by default (triggers create path)
  http.get('*/rest/v1/guests*', () => HttpResponse.json([])),

  // guest insert
  http.post('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),

  // guest update (last_viewed_at)
  http.patch('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),

  // questions
  http.get('*/rest/v1/questions*', () => HttpResponse.json(QUESTIONS)),

  // submissions — GET (all stats + guest-specific)
  http.get('*/rest/v1/submissions*', ({ request }) => {
    const url = new URL(request.url)
    // count-only head request from LoginPage
    if (request.method === 'HEAD' || request.headers.get('Prefer')?.includes('count')) {
      return new HttpResponse(null, {
        headers: { 'Content-Range': '0-1/2' },
      })
    }
    const guestFilter = url.searchParams.get('guest_id')
    if (guestFilter) return HttpResponse.json(SUBMISSIONS)
    return HttpResponse.json(SUBMISSIONS)
  }),

  // submission upsert
  http.post('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),

  // HEAD count query from LoginPage — default: 0 submissions (new guest)
  http.head('*/rest/v1/submissions*', () =>
    new HttpResponse(null, { headers: { 'Content-Range': '*/0' } })
  ),
]
