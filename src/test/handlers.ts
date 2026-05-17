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
    correct_answer_index: null,
    locked_at: null,
    display_order: 1,
    is_active: true,
  },
  {
    id: 'q2',
    text: 'How long will the first dance be?',
    options: ['Under 3 min', '3–5 min', 'Over 5 min'],
    category: 'Reception',
    correct_answer_index: null,
    locked_at: null,
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
  // guests — no existing guest by default (triggers create path)
  http.get('*/rest/v1/guests*', () => HttpResponse.json([])),

  // guest insert
  http.post('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),

  // guest update (last_viewed_at)
  http.patch('*/rest/v1/guests*', () => HttpResponse.json([GUEST])),

  // questions
  http.get('*/rest/v1/questions*', () => HttpResponse.json(QUESTIONS)),
  http.patch('*/rest/v1/questions*', () => HttpResponse.json(QUESTIONS)),

  // submissions — GET (all stats + guest-specific)
  http.get('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),

  // submission upsert
  http.post('*/rest/v1/submissions*', () => HttpResponse.json(SUBMISSIONS)),

  // get_question_stats RPC — default: no responses
  http.post('*/rest/v1/rpc/get_question_stats', () =>
    HttpResponse.json(
      QUESTIONS.map((q) => ({
        question_id: q.id,
        option_counts: q.options.map(() => 0),
        total_responses: 0,
      })),
    ),
  ),
]
