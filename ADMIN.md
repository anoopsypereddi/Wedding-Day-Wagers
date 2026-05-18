# Wedding Wagers — Host Playbook

Step-by-step guide for the person running the game during a wedding. If you're a developer setting up the project for the first time, start with the main [README.md](./README.md).

---

## Quick reference

| Where | What |
|-------|------|
| `/admin/login` | Password prompt |
| `/admin` | Overview — counts at a glance |
| `/admin/questions` | Add, edit, reorder, deactivate questions |
| `/admin/game` | Lock questions and mark correct answers |
| `/admin/submissions` | See who answered what; export CSV |
| `/admin/leaderboard` | Current standings |

The admin password is whatever was set in `VITE_ADMIN_PASSWORD` at deploy time. After you log in once, your browser remembers (a token in `localStorage['wedding_admin_token']`) until you click **Logout**.

---

## Before the wedding — setup

### 1. Write the questions

Go to **`/admin/questions`** → **Add question**.

Each question needs:
- **Question text** — what guests will read (e.g. *"How long will the maid of honor's toast be?"*)
- **Options** — 2 to 6 answer choices. Empty options are filtered out on save.
- **Category** (optional) — purely a label, not shown to guests; useful for grouping in the admin UI later
- **Active** — leave checked. Unchecking hides a question from guests entirely.

Click **Save**. The question appears at the bottom of the list.

### 2. Order the questions

In **`/admin/questions`**, every question has **↑** and **↓** arrows. Tapping them swaps a question with its neighbor and renumbers the whole list. Guests see them in this order.

Reordering writes to the database immediately — no Save button.

### 3. Edit or delete

- **Edit**: pencil icon opens the same modal as Add, pre-filled. Editing text or options does **not** wipe submissions — guests' picks stay attached by option index.
- **Delete**: trash icon → confirmation modal. **This cascades**: deleting a question deletes every guest's submission for it. Use **deactivate** (uncheck Active) instead if you might want it back.

### 4. Sanity check before the event

Open `/` in an incognito window, log in as a fake guest (e.g. name "Test", phone "5550000000"), and tap through every question. Make sure:
- The questions and options read correctly
- The order makes sense
- The category labels (if any) are right

Then go to `/admin/submissions`, find the test guest, and delete the row from the database (or just leave it — they'll get a 0% leaderboard rank and be obvious).

---

## During the wedding — running the game

The main control surface is **`/admin/game`**. It lists every question with its current state and the controls you need.

### Question states

Each question is in one of three states:

| State | Meaning | What guests see |
|-------|---------|-----------------|
| **Open** | `locked_at` is null, no answer set | Clickable option buttons; their pick autosaves on tap |
| **Locked** | `locked_at` is set, no answer yet | Donut chart with live vote percentages; their own pick highlighted |
| **Scored** | A correct answer is set | Donut chart + correct answer in green + their pick in green (right) or red (wrong) |

Guests' screens poll every 30 seconds, so state changes appear within half a minute without anyone refreshing.

### The two actions that matter

**1. Lock a question** — Click the lock toggle on the question's row. The question stops accepting picks immediately (a Postgres trigger enforces this server-side, so even if someone has the page open, their next tap will fail). The card flips to the donut on guests' next poll.

**2. Mark the correct answer** — Select a radio button next to the correct option, then **Save**. Two things happen:
- The answer is recorded.
- If the question wasn't already locked, it auto-locks (the database does this with a trigger; you don't need a separate step).

The card flips to its scored state on guests' next poll, and the leaderboard updates.

### Bulk actions

At the top of `/admin/game`:
- **Lock all open** — locks every currently-open question in one click. Useful for the "OK that's the cutoff, everyone stop tapping" moment.
- **Unlock all** — clears `locked_at` *and* `correct_answer_index` on every locked or scored question. **This wipes any answers you've already marked.** Only use it for resetting between dry runs.

### A typical event timeline

| Phase | What you do |
|-------|-------------|
| Guests arrive, cocktail hour | Questions are open. Guests log in and tap picks. |
| Just before dinner | Click **Lock all open** — that's the cutoff. |
| As real-life events happen | For each question whose answer just played out, set the correct answer in `/admin/game` and Save. The leaderboard updates live. |
| End of night | Either reveal a final winner from `/admin/leaderboard`, or export submissions from `/admin/submissions` for a slideshow. |

You can also reveal answers one at a time *while* other questions are still open — `/admin/game` is per-question, not all-or-nothing.

### Watching the leaderboard

`/admin/leaderboard` shows the current ranking. Top 3 get trophies (🥇🥈🥉); the rest get numeric ranks. The "% correct" column is *(correct answers / questions you marked an answer for)* — so as you reveal more, scores can change.

Click **Refresh** to pull the latest standings (it doesn't poll automatically on this view).

### Watching submissions

`/admin/submissions` lists every guest with a submission count. Search by name. Click a row to expand and see all their answers.

**CSV export** dumps Guest Name, Question, Answer, Submitted timestamp — handy for a "who picked what" post-game readout.

A separate amber callout at the bottom flags guests who logged in but never submitted, in case you want to nudge them.

---

## How guests use it (so you know what they're seeing)

1. They land on `/`, see the VA wreath logo, and enter **name + phone**.
2. Phone is normalized to digits-only for uniqueness, so two "Alice"s with different phones don't collide. Minimum 7 digits.
3. They're routed to `/game`. A progress bar shows "X of N open questions answered."
4. They tap options. Each tap autosaves immediately (optimistic UI; rolls back if the server rejects).
5. When you lock a question, their card flips to a donut chart with their pick highlighted.
6. When you reveal an answer, the card flips again — green if they were right, red if wrong.
7. They can tap **🏆 Leaderboard** in the header any time.
8. **Change name** logs them out (clears `sessionStorage['wedding_guest']`).

Guests' sessions persist across refresh but not across browsers — if someone logs in on their phone and then opens the site on their laptop, they need to re-enter their name and phone. As long as they use the same phone number, they'll match back to the same guest row and their picks will be there.

---

## Troubleshooting

**"A guest says their picks aren't saving."**
The most common cause is that the question is locked. Check `/admin/game` — if `locked_at` is set, the server is rejecting their picks. Either unlock it (clears the lock but keeps existing picks) or accept that they missed the window.

**"A guest can't find their picks after logging in on a new device."**
They almost certainly typed a different phone number, or the spaces/dashes are different in a way that *isn't* just punctuation. Phone is normalized to digits-only, so `(555) 123-4567` and `555.123.4567` are the same — but `5551234567` and `15551234567` are not (the country code makes them different).

**"I deleted a question by accident."**
There's no undo. Submissions for that question are gone too (cascade delete). Recreate it; guests can re-tap.

**"The leaderboard didn't update after I marked an answer."**
The admin leaderboard view doesn't auto-poll — click **Refresh**. Guest views poll every 30 seconds, so they'll see changes within that window.

**"Two guests have the same name on the leaderboard."**
That's fine — they're separate guest rows keyed by phone. The leaderboard shows display name only; if you need to disambiguate, check `/admin/submissions` which shows submission counts and timestamps per guest.

**"I want to do a dry run, then reset."**
Use **Unlock all** in `/admin/game` to clear all locks and revealed answers. To also wipe guest submissions, delete the test guests from `/admin/submissions` (or run a `DELETE FROM submissions` / `DELETE FROM guests` in Supabase Studio before the real event).

**"The admin login isn't accepting my password."**
The password is set at deploy time via the `VITE_ADMIN_PASSWORD` environment variable. It's baked into the build, so changing it requires a redeploy. If you forgot it, check Vercel's project settings.

---

## Security notes (read once, then forget)

- The admin password is a **client-side check** baked into the bundle. It keeps casual guests out of `/admin`, but anyone determined enough to read the JS bundle can find it. Don't use a password you reuse elsewhere.
- The Supabase anon key is also public — Row Level Security policies are what actually protect the data. The policies allow public read/write on `guests` and `submissions` (necessary because guests aren't authenticated), and the `locked_at` trigger is what stops cheating after a question is closed.
- Don't put real PII in the question text or option labels. Phone numbers entered by guests are stored in plaintext in the `guests.phone` column.
