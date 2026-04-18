# Wedding Wagers

A prediction game for wedding guests. Everyone picks their answers to fun questions about the couple, watches live vote breakdowns, and competes on a leaderboard once the correct answers are revealed.

![React](https://img.shields.io/badge/React_19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6) ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E) ![Vite](https://img.shields.io/badge/Vite-646CFF)

---

## How it works

**Guests** visit the site, enter their name, and answer multiple-choice prediction questions (e.g. *"Who will cry first?"*, *"How long will the vows be?"*). After submitting, they see live donut charts showing how everyone else voted — with their own pick highlighted.

**The host** uses a password-protected admin panel to manage questions, set a submission deadline, reveal correct answers one by one, and watch the leaderboard fill in.

Once answers are revealed, guests are ranked by accuracy percentage.

---

## Features

- No accounts — guests just enter a name
- Live vote distribution charts (SVG donut charts)
- Automatic locking — via countdown timer or when the first answer is revealed
- Leaderboard with accuracy scores
- Admin panel: question editor, answer marking, submission viewer, lock controls
- Mobile-friendly

---

## Tech stack

- **Frontend**: React 19 + TypeScript + Vite
- **Database**: Supabase (Postgres + Row Level Security)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library + MSW

---

## Running locally

```bash
npm install
cp .env.example .env.local
# fill in your Supabase URL, anon key, and admin password
npm run dev
```

You'll need a Supabase project with the migrations in `supabase/migrations/` applied in order.

```bash
npm test           # run tests
npm run build      # production build
```

---

## Admin panel

Visit `/admin` and enter the password set in `VITE_ADMIN_PASSWORD`. From there you can:

- Create and order questions
- Set a submission deadline
- Mark correct answers (this auto-locks submissions)
- View all guest responses
- Track the leaderboard live
