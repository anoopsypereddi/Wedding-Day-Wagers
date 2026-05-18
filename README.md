# Wedding Wagers

A prediction game for wedding guests. Everyone picks their answers to fun questions about the couple, watches live vote breakdowns, and competes on a leaderboard once the correct answers are revealed.

![React](https://img.shields.io/badge/React_19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E) ![Vite](https://img.shields.io/badge/Vite_8-646CFF) ![Tailwind](https://img.shields.io/badge/Tailwind_3-06B6D4)

---

## How it works

**Guests** visit the site, enter their name and phone number, and start tapping picks on multiple-choice questions (e.g. *"Who will cry first?"*, *"How long will the vows be?"*). Picks autosave on every tap — no submit button. Once a question is locked, the card flips to a live donut chart showing how everyone voted, with the guest's own pick highlighted. When the answer is revealed, the card flips again to show who got it right.

**The host** uses a password-protected admin panel to manage questions, lock submissions per question, reveal correct answers, watch the leaderboard fill in, and export everyone's responses as CSV.

Once answers are revealed, guests are ranked by accuracy percentage.

See [ADMIN.md](./ADMIN.md) for a step-by-step host playbook.

---

## Features

- **Phone-based identity** — guests enter a name + phone; phone (digits-only) is the unique key, so two guests named "Alice" never collide
- **Autosave picks** — each tap writes immediately with optimistic UI and rollback on error; no submit button
- **Three-state question cards** — open → locked (live donut chart) → scored (correct answer + your pick marked)
- **Live polling** — guests' question state and vote totals refresh every 30 seconds, no manual reload
- **Per-question locking** — admin locks/reveals questions one at a time; setting a correct answer auto-locks
- **Server-enforced lock** — a Postgres trigger rejects late picks even if the client tries
- **Leaderboard** — server-side ranking RPC, accuracy %, top-3 trophies
- **Admin tools** — question CRUD with arrow-based reordering, bulk lock/unlock, CSV export of all submissions
- **Mobile-first** — sticky bottom nav on admin, tap-friendly cards on guest

---

## Tech stack

- **Frontend**: React 19, TypeScript, Vite 8, React Router 7
- **Database**: Supabase (Postgres + Row Level Security + RPCs + triggers)
- **Styling**: Tailwind CSS 3 with custom pastel palette
- **Testing**: Vitest 4 + React Testing Library + MSW 2 (Supabase REST mocked)
- **Deploy**: Vercel (SPA rewrite in `vercel.json`)
- **Hooks**: Husky + lint-staged (ESLint + Vitest on staged `*.ts`/`*.tsx`)

---

## Routes

### Guest
| Path | Purpose |
|------|---------|
| `/` | Login (name + phone) |
| `/game` | Question feed; tap-to-pick; flips to donut on lock; flips to scored on reveal |
| `/leaderboard` | Live ranking by accuracy |

### Admin (password-gated)
| Path | Purpose |
|------|---------|
| `/admin/login` | Password prompt |
| `/admin` | Overview cards (questions, guests, submissions, answers marked) |
| `/admin/questions` | Question CRUD + arrow-based reordering |
| `/admin/game` | Per-question lock/unlock + mark correct answer (bulk actions too) |
| `/admin/submissions` | Per-guest answers; CSV export |
| `/admin/leaderboard` | Live ranking |

---

## Running locally

```bash
npm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_PASSWORD
npm run dev
```

You'll need a Supabase project with the migrations in `supabase/migrations/` applied in order (001 → 007).

```bash
npm test              # vitest run
npm run test:watch    # vitest in watch mode
npm run test:coverage # coverage report
npm run build         # tsc -b && vite build
npm run lint          # eslint .
```

### Environment variables

| Var | Purpose |
|-----|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (RLS enforces auth on the DB side) |
| `VITE_ADMIN_PASSWORD` | Password for the `/admin/login` form |

---

## Database

Seven migrations in `supabase/migrations/`, applied in order:

| # | File | Adds |
|---|------|------|
| 001 | `001_initial_schema.sql` | `questions`, `guests`, `submissions` tables; `UNIQUE(guest_id, question_id)` |
| 002 | `002_rls_policies.sql` | Row Level Security on all tables (public read/write for guests + submissions; auth-only writes for questions) |
| 003 | `003_leaderboard_rpc.sql` | `get_leaderboard()` — server-side ranking by accuracy |
| 004 | `004_per_question_lock.sql` | `questions.locked_at` column; trigger auto-locks on reveal; trigger rejects submissions to locked questions |
| 005 | `005_question_stats_rpc.sql` | `get_question_stats()` — per-option vote counts for donut charts |
| 006 | `006_submissions_question_id_index.sql` | `submissions(question_id)` index for stats and leaderboard joins |
| 007 | `007_guest_phone.sql` | `guests.phone` column + unique index on digits-only form |

### Key tables

- **`questions`**: `id`, `text`, `options` (JSONB array), `category`, `correct_answer_index`, `display_order`, `is_active`, `locked_at`, `created_at`
- **`guests`**: `id`, `name`, `phone` (unique on digits-only), `created_at`, `last_viewed_at`
- **`submissions`**: `id`, `guest_id`, `question_id`, `selected_option_index`, `created_at` — UNIQUE per `(guest_id, question_id)` so each tap upserts

### Server-enforced rules

- Setting `correct_answer_index` on a question with `locked_at = NULL` auto-sets `locked_at = NOW()`.
- INSERT/UPDATE to `submissions` is rejected (raised exception) if the target question has `locked_at IS NOT NULL`.

---

## Identity & session

- **Guest identity**: name + phone. Phone is normalized by stripping non-digits — `(555) 123-4567` and `5551234567` collide on purpose. Minimum 7 digits.
- **Guest session**: stored in `sessionStorage` under `wedding_guest` (survives refresh; cleared on logout).
- **Admin session**: stored in `localStorage` under `wedding_admin_token` after password match.

Neither uses Supabase Auth — the anon key + RLS is the only API gate, and the admin password is checked client-side. Don't put anything sensitive in `VITE_ADMIN_PASSWORD`; treat the admin panel as a soft gate, not a security boundary.

---

## Testing

- Integration flows in `src/__tests__/flows/`: new guest, returning guest, editing answers, per-question lock
- Hook unit tests in `src/hooks/*.test.ts`
- Component test for `QuestionCard` (open/locked/scored modes)
- MSW server in `src/test/server.ts` mocks Supabase REST endpoints and RPCs
- Custom `renderApp()` in `src/test/renderApp.tsx` wraps the full provider tree

---

## Admin

See [ADMIN.md](./ADMIN.md) for the full host playbook — setup, running the game during the event, troubleshooting.
