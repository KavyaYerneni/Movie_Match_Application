# Movie Match — Swipe-to-Vote Web App

**CMPE 285 Final · AI-Assisted Coding Challenge**

## Project theme

**Movie Matchups** — a mobile-first “Tinder for films” experience. Users swipe through a deck of movies and vote **yes** (would watch) or **no** (would skip). Votes are stored on a real backend and aggregated across all users. Open the **Results** tab (or swipe down on the deck) to see community rankings.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18, Vite, vanilla CSS |
| Backend | Node.js, Express |
| Database | SQLite (`better-sqlite3`) |
| AI tooling | Claude (ideas), Cursor (implementation) — see [`AI_NOTES.md`](./AI_NOTES.md) |

Target viewport: **390×844** (iPhone-class). Touch swipes and mouse drag are both supported.

---

## How to run (fresh clone)

### Prerequisites

- **Node.js 18+** and npm

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run seed          # loads 122 movies into movie-match.db
npm start             # API at http://localhost:3001
```

You should see: `Movie Match API listening on http://localhost:3001`

**Port already in use?** Another process may be holding port 3001:

```bash
lsof -ti :3001 | xargs kill -9
npm start
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev           # app at http://localhost:5173
```

Open **http://localhost:5173** in the browser. For mobile testing, use Chrome DevTools → device toolbar (e.g. iPhone 12/14) or visit `http://<your-lan-ip>:5173` from a phone on the same Wi‑Fi.

### Production build (optional)

```bash
cd frontend && npm run build && npm run preview
```

The dev server proxies `/api/*` to the backend (`vite.config.js`). Keep the backend running while using the app.

### Quick health check

```bash
curl http://localhost:3001/health
# → {"ok":true,"items":122}
```

---

## Project structure

```
movie-match/
├── backend/
│   ├── server.js           # Express API
│   ├── db.js               # SQLite schema
│   ├── seed.js             # Seed script (npm run seed)
│   ├── generate-movies.js  # Regenerate movies.json
│   ├── movies.json         # 122 movie records
│   └── movie-match.db      # Created after seed (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/     # SwipeDeck, MovieCard, Results, Matches
│   │   ├── hooks/useSwipe.js
│   │   └── utils/poster.js
│   └── vite.config.js
├── README.md
└── AI_NOTES.md             # AI collaboration reflection (required)
```

---

## Architecture

The app is a classic **client–server** design. The **backend is the source of truth** for all votes and aggregates; the browser only caches an anonymous `sessionId` in `localStorage` for convenience (not vote data).

On startup, the frontend calls `POST /session` (if needed), then `GET /items?sessionId=` to load movies the user has not voted on yet. Each swipe or button tap sends `POST /vote` with `{ itemId, choice, sessionId }`. The results screen calls `GET /results?sort=` and refreshes on an 8-second poll so counts stay reasonably current without WebSockets.

The server uses **SQLite** with four tables: `items` (movie catalog), `votes` (one row per user+movie), `sessions` (anonymous visitors), and `swipe_events` (optional timing analytics). Express validates every payload (session id format, `yes`/`no` only, item must exist) and never trusts the client to enforce “vote once” rules—that is handled in the database.

---

## API reference

### Required endpoints (assignment)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/items?sessionId=` | Movies this session has not voted on yet |
| `POST` | `/vote` | Body: `{ itemId, choice: "yes" \| "no", sessionId, decisionMs? }` |
| `GET` | `/results?sort=` | Aggregated yes/no per movie |

**Sort values:** `most-loved`, `most-hated`, `most-divisive`, `most-voted`, `most-skipped`

### Additional endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/session` | Create anonymous session id |
| `DELETE` | `/vote/last?sessionId=` | Undo most recent vote (stretch) |
| `GET` | `/skips?sessionId=` | Movies **you** voted no on (My Skips tab) |
| `GET` | `/matches?sessionId=&threshold=` | Your “yes” votes where community yes-rate ≥ threshold (stretch) |
| `GET` | `/analytics` | Total swipes, sessions, avg decision time (stretch) |
| `POST` | `/admin/items` | Add a movie at runtime; header `x-admin-key: movie-match-dev` (stretch) |
| `GET` | `/health` | `{ ok, items }` sanity check |

---

## Vote deduplication (required)

**Problem:** A user must not be able to count the same movie twice.

**Approach:**

1. **Database:** `UNIQUE(item_id, session_id)` on the `votes` table.
2. **API:** Before insert, the server checks for an existing row; duplicates return **HTTP 409** with a clear error.
3. **Client:** On 409, the UI advances the deck (treats as already voted) instead of double-submitting.

`sessionId` is a random 24-character string stored in `localStorage` so votes persist across page reloads without a full login system. This is **not** used as the authoritative store of votes—only the server is.

---

## Persistence choice (required justification)

**SQLite** was chosen because:

- **Zero setup** — single file (`movie-match.db`), no Docker or cloud account for a timed exam.
- **ACID transactions** — vote inserts and analytics are consistent.
- **Easy seeding** — `npm run seed` loads 122 movies from `movies.json` in one command.
- **Fits the rubric** — real server-side persistence, not `localStorage`.

**Trade-off:** SQLite serializes writes on one file; fine for a classroom demo on `localhost`, but would need Postgres or similar for high concurrent write load in production.

---

## Trade-offs under time pressure

| Decision | Why | Cost |
|----------|-----|------|
| SQLite over Firebase/Supabase | Faster local setup, no API keys | No hosted demo without extra deploy step |
| Cinemeta / MetaHub posters | Real movie artwork per IMDb id; no API key required | Depends on external metadata service |
| Polling (8s) vs WebSockets | Simpler to ship; meets “real-time-ish” stretch | Results not instant |
| Anonymous session vs OAuth | Meets stretch with minimal UI | No cross-device identity |
| Single-repo monolith layout | Easier to grade and run | Frontend/backend not separately deployed |
| Overlay card layout | Title + synopsis always visible on small screens | Less “full poster only” aesthetic |

---

## Requirements checklist

### Core (Section 3.1)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Clear theme documented (**Movie Matchups**) | Done |
| 2 | **100+** distinct items (122 movies), each with image, label, description | Done |
| 3 | Swipe right = yes, left = no; Yes/No buttons; tilt, color hints, movement threshold | Done |
| 4 | Smooth transition to next card after vote | Done |
| 5 | Results view (tab + swipe down); aggregate yes/no; sorting/filtering | Done |
| 6 | Backend persistence — server is source of truth | Done |
| 7 | End-of-deck state when user finished voting | Done |

### Stretch (Section 3.2)

| # | Requirement | Status |
|---|-------------|--------|
| 7 | Anonymous session id (persists across reload) | Done |
| 8 | Undo last swipe | Done |
| 9 | “Matches” view (user yes + high global yes-rate) | Done |
| 10 | Live-ish updates via polling on Results | Done |
| 11 | Admin/seed path to add movies (`POST /admin/items`, `generate-movies.js`) | Done |
| 12 | Basic analytics (`GET /analytics`, shown on Results) | Done |

---

## Data & image credits

- **Movie text:** Titles, years, genres, and synopses are written for this demo (educational use).
- **Images:** Official-style movie posters via [Cinemeta](https://github.com/Stremio/stremio-addon-sdk) / [MetaHub](https://images.metahub.space) (IMDb `tt` IDs). If a poster fails to load, an inline **SVG fallback** shows the film title.
- **Regenerate posters:** `cd backend && node generate-movies.js && npm run seed` (~3 min; fetches posters from Cinemeta)

---

## Known issues

1. **Desktop mouse:** Very fast drags sometimes trigger `mouseleave` before `mouseup`, so a swipe may need a second attempt; touch on a real phone feels better.
2. **`most-divisive` sort:** Ranks films closest to a 50/50 yes/no split; low vote counts can look divisive with few total swipes.
3. **Port 3001:** Only one backend instance can run at a time; see “Port already in use?” above.
4. **Stale session after re-seed:** If you re-run `npm run seed` while testing, clear `localStorage` key `movie-match-session` or use a private window so `/items` matches the new database.

---

## AI usage write-up

*Required reflection on AI-assisted development (CMPE 285). A copy also lives in [`AI_NOTES.md`](./AI_NOTES.md).*

### What the AI wrote end-to-end

- Project scaffolding (folder layout, `package.json` files, Vite proxy config)
- Bulk movie seed generator (`generate-movies.js`) and `movies.json` catalog
- Express route handlers, SQLite schema, and vote deduplication via `UNIQUE(item_id, session_id)`
- React components: swipe deck, movie card, results/matches views, and mobile CSS
- Initial README and API documentation outline

### Where I had to fix or rewrite (concrete example)

The assistant sometimes generated invalid JSX tags (`<motion>` instead of `<div>`), which broke the build. I fixed this with a search-and-replace across `*.jsx` before testing. I also corrected `SwipeDeck` pointer handlers so touch and mouse events were not fired twice on the same gesture, and verified that poster images and descriptions were visible after changing the card layout to a bottom gradient overlay.

### What the AI did better or worse than expected

**Better:** A full vertical slice (seed data → API → swipe UI → results) came together quickly, including stretch features like undo, matches, and analytics.

**Worse:** First-pass image URLs (placehold.co) and card layout hid movie descriptions; I had to steer a second iteration toward reliable images (picsum.photos) and overlay typography. Rubric items (100+ items, dedup, pull-down to results) needed manual verification rather than assuming completeness.

### AI tools used

**Claude** — I used Claude early in the project to brainstorm the **Movie Matchups** theme, compare stack choices (React + Express + SQLite), and outline stretch features such as undo, matches, and analytics. It helped me turn the assignment rubric into a concrete feature list before I started building.

**Cursor** — I used Cursor as the main implementation environment to generate and refine code: API routes, the swipe deck, poster loading, and UI polish. I reviewed every change, fixed build issues (for example invalid JSX), and re-tested flows such as vote deduplication and the results tab before committing.
