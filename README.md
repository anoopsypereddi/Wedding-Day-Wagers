# Wedding Gambling Game

Guests predict outcomes for the wedding, see how their answers compare to everyone else's, and find out who was right after the ceremony.

## Stack

React + TypeScript + Vite, Tailwind CSS, Supabase (auth, DB), React Router

## Guest flow

1. Enter name → new guests go to questions, returning guests go to results
2. Answer all questions → submit
3. Results page shows donut charts with vote breakdowns
4. "Edit answers" available until locked

## Admin (`/admin`)

- Manage questions, mark correct answers, view submissions, leaderboard
- **Lock** page: set a deadline after which guests can't change answers
- Editing also locks automatically once any correct answer is revealed

## Supabase tables

`guests`, `questions`, `submissions`, `game_settings`

```sql
-- game_settings (one row)
create table game_settings (
  id int primary key default 1,
  lock_at timestamptz,
  constraint single_row check (id = 1)
);
insert into game_settings (id) values (1) on conflict do nothing;
```

## Dev

```bash
npm install
cp .env.example .env.local  # add Supabase URL + anon key
npm run dev
npm test
```
