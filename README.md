# Movie Match — Swipe-to-Vote (CMPE 285 Final)

**Theme:** Movie Matchups — swipe right if you would watch it, left if you would skip. Pull down or use the **Results** tab to see how everyone voted.

Mobile-first web app (optimized for **390×844**). Stack: **React + Vite** frontend, **Node.js + Express + SQLite** backend.

## Quick start

### Prerequisites

- Node.js 18+

### 1. Backend

```bash
cd backend
npm install
npm run seed    # loads 124 movies (requires movies.json — already generated)
npm start       # http://localhost:3001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173 (proxies /api → backend)
```

Open **http://localhost:5173** in Chrome DevTools device mode (iPhone 12/14) or on your phone (same Wi‑Fi, use your machine IP).

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/items?sessionId=` | Movies not yet voted by this session |
| `POST` | `/vote` | Body: `{ itemId, choice: "yes"\|"no", sessionId, decisionMs? }` |
| `GET` | `/results?sort=` | Aggregated counts; sort: `most-loved`, `most-hated`, `most-divisive`, `most-voted` |
| `POST` | `/session` | Create anonymous session id |
| `DELETE` | `/vote/last?sessionId=` | Undo last vote (stretch) |
| `GET` | `/matches?sessionId=&threshold=` | Your yes votes with high community yes-rate (stretch) |
| `GET` | `/analytics` | Total swipes, sessions, avg decision time (stretch) |
| `POST` | `/admin/items` | Add movie; header `x-admin-key: movie-match-dev` (stretch) |

## Architecture

The **backend** is the source of truth. SQLite stores `items` (124 movies), `votes` (one row per session+movie via `UNIQUE(item_id, session_id)`), `sessions`, and `swipe_events` for analytics. Express validates all inputs (session id format, choice enum, item exists) and returns 409 on duplicate votes.

The **frontend** keeps an anonymous `sessionId` in `localStorage` (cache only). It fetches the remaining deck from `/items`, records votes on swipe or button tap, and polls `/results` every 8s on the results screen. Swipe gestures use touch and mouse with tilt, green/red tint, and YES/NO stamps past a 100px threshold.

### Deduplication

Votes are deduplicated with a **database unique constraint** on `(item_id, session_id)`. The API returns **409** if the client retries. The frontend skips ahead on 409. This prevents double-counting without trusting the client.

### Persistence choice (SQLite)

SQLite fits a timed exam: zero external services, single file (`movie-match.db`), ACID transactions, and easy `npm run seed`. Trade-off: not ideal for massive concurrent write load, but correct for localhost demo and rubric requirements.

## Requirements checklist

### Core (Section 3.1)

- [x] Theme documented (Movie Matchups)
- [x] 124 movies with image, label, description
- [x] Swipe right = yes, left = no; Yes/No buttons; tilt, color hints, threshold
- [x] Smooth card transition after vote
- [x] Results view (tab + swipe down); aggregate yes/no; sort filters
- [x] Backend persistence (SQLite)
- [x] End-of-deck state

### Stretch (Section 3.2)

- [x] Anonymous session id (`POST /session`, localStorage)
- [x] Undo last swipe
- [x] Matches view (≥60% community yes)
- [x] Results polling (8s)
- [x] Admin endpoint to add movies
- [x] Basic analytics on results screen

## Image credits

Movie poster placeholders generated via [placehold.co](https://placehold.co) (synthetic images, no real people).

## Known issues

- Swipe `onEnd` on very fast flicks may occasionally need a second try on desktop (mouse leave fires early).
- `most-divisive` sort uses closeness to 50/50 yes rate; ties break by total votes.

## Submission (Question 10)

Per course instructions, also submit:

1. Three screenshots of the running app  
2. YouTube demo (3–5 min)  
3. Email code link + video to **coolprofsinn2@gmail.com** — subject: **CMPE 285 Final question 10**

See `AI_NOTES.md` for AI collaboration reflection.
