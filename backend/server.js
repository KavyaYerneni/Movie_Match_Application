const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json({ limit: '32kb' }));

function ensureDbSeeded() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM items').get().n;
  if (count >= 100) return;
  const seedPath = path.join(__dirname, 'seed.js');
  if (fs.existsSync(path.join(__dirname, 'movies.json'))) {
    require('./seed');
  }
}

ensureDbSeeded();

function touchSession(sessionId) {
  db.prepare(`
    INSERT INTO sessions (id, last_active) VALUES (?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET last_active = datetime('now')
  `).run(sessionId);
}

function isValidChoice(choice) {
  return choice === 'yes' || choice === 'no';
}

function isValidSessionId(id) {
  return typeof id === 'string' && id.length >= 8 && id.length <= 64 && /^[a-zA-Z0-9_-]+$/.test(id);
}

/** GET /items — movies for this session (excludes already voted) */
app.get('/items', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId || !isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'Valid sessionId query parameter required' });
  }
  touchSession(sessionId);

  const rows = db.prepare(`
    SELECT i.id, i.label, i.description, i.image_url, i.year, i.genre
    FROM items i
    WHERE i.id NOT IN (
      SELECT item_id FROM votes WHERE session_id = ?
    )
    ORDER BY i.id
  `).all(sessionId);

  const total = db.prepare('SELECT COUNT(*) AS n FROM items').get().n;
  const voted = db.prepare('SELECT COUNT(*) AS n FROM votes WHERE session_id = ?').get(sessionId).n;

  res.json({ items: rows, total, voted, remaining: rows.length });
});

/** POST /vote — record yes/no; idempotent per (sessionId, itemId) */
app.post('/vote', (req, res) => {
  const { itemId, choice, sessionId, decisionMs } = req.body || {};

  if (!itemId || typeof itemId !== 'string') {
    return res.status(400).json({ error: 'itemId is required' });
  }
  if (!isValidChoice(choice)) {
    return res.status(400).json({ error: 'choice must be "yes" or "no"' });
  }
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'Valid sessionId required' });
  }

  const item = db.prepare('SELECT id FROM items WHERE id = ?').get(itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  touchSession(sessionId);

  const existing = db.prepare(
    'SELECT id, choice FROM votes WHERE item_id = ? AND session_id = ?'
  ).get(itemId, sessionId);

  if (existing) {
    return res.status(409).json({
      error: 'Already voted on this item',
      existingChoice: existing.choice,
    });
  }

  const insertVote = db.prepare(`
    INSERT INTO votes (item_id, session_id, choice) VALUES (?, ?, ?)
  `);
  const insertEvent = db.prepare(`
    INSERT INTO swipe_events (session_id, item_id, choice, decision_ms)
    VALUES (?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    insertVote.run(itemId, sessionId, choice);
    const ms = typeof decisionMs === 'number' && decisionMs >= 0 ? Math.round(decisionMs) : null;
    insertEvent.run(sessionId, itemId, choice, ms);
  });

  try {
    tx();
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ error: 'Duplicate vote' });
    }
    throw err;
  }

  res.status(201).json({ ok: true, itemId, choice });
});

/** DELETE /vote/last — undo most recent vote for session (stretch) */
app.delete('/vote/last', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'Valid sessionId required' });
  }

  const last = db.prepare(`
    SELECT id, item_id, choice FROM votes
    WHERE session_id = ?
    ORDER BY id DESC LIMIT 1
  `).get(sessionId);

  if (!last) {
    return res.status(404).json({ error: 'No votes to undo' });
  }

  db.prepare('DELETE FROM votes WHERE id = ?').run(last.id);
  res.json({ undone: { itemId: last.item_id, choice: last.choice } });
});

/** GET /results — aggregated yes/no counts */
app.get('/results', (req, res) => {
  const sort = req.query.sort || 'most-loved';
  const validSorts = ['most-loved', 'most-hated', 'most-divisive', 'most-voted', 'most-skipped'];
  if (!validSorts.includes(sort)) {
    return res.status(400).json({ error: `sort must be one of: ${validSorts.join(', ')}` });
  }

  let rows = db.prepare(`
    SELECT
      i.id,
      i.label,
      i.description,
      i.image_url,
      i.year,
      i.genre,
      COALESCE(SUM(CASE WHEN v.choice = 'yes' THEN 1 ELSE 0 END), 0) AS yes_count,
      COALESCE(SUM(CASE WHEN v.choice = 'no' THEN 1 ELSE 0 END), 0) AS no_count,
      COUNT(v.id) AS total_votes
    FROM items i
    LEFT JOIN votes v ON v.item_id = i.id
    GROUP BY i.id
  `).all();

  rows = rows.map((r) => {
    const total = r.yes_count + r.no_count;
    const yes_rate = total > 0 ? Math.round((r.yes_count / total) * 100) : 0;
    const no_rate = total > 0 ? Math.round((r.no_count / total) * 100) : 0;
    const divisiveness = total > 0
      ? Math.abs(50 - yes_rate)
      : 50;
    return { ...r, yes_rate, no_rate, divisiveness };
  });

  switch (sort) {
    case 'most-loved':
      rows.sort((a, b) => b.yes_rate - a.yes_rate || b.yes_count - a.yes_count);
      break;
    case 'most-hated':
      rows.sort((a, b) => a.yes_rate - b.yes_rate || b.no_count - a.no_count);
      break;
    case 'most-divisive':
      rows.sort((a, b) => a.divisiveness - b.divisiveness || b.total_votes - a.total_votes);
      break;
    case 'most-voted':
      rows.sort((a, b) => b.total_votes - a.total_votes);
      break;
    case 'most-skipped':
      rows.sort((a, b) => b.no_rate - a.no_rate || b.no_count - a.no_count);
      break;
    default:
      break;
  }

  res.json({ results: rows, sort });
});

/** GET /skips — movies this session voted "no" on */
app.get('/skips', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'Valid sessionId required' });
  }

  const rows = db.prepare(`
    SELECT i.id, i.label, i.description, i.image_url, i.year, i.genre, uv.choice
    FROM items i
    INNER JOIN votes uv ON uv.item_id = i.id AND uv.session_id = ? AND uv.choice = 'no'
    ORDER BY uv.id DESC
  `).all(sessionId);

  res.json({ skips: rows, count: rows.length });
});

/** GET /matches — user yes votes where global yes_rate >= threshold */
app.get('/matches', (req, res) => {
  const sessionId = req.query.sessionId;
  const threshold = Number(req.query.threshold) || 60;
  if (!isValidSessionId(sessionId)) {
    return res.status(400).json({ error: 'Valid sessionId required' });
  }

  const rows = db.prepare(`
    SELECT
      i.id, i.label, i.description, i.image_url, i.year, i.genre,
      SUM(CASE WHEN v.choice = 'yes' THEN 1 ELSE 0 END) AS yes_count,
      COUNT(v.id) AS total_votes
    FROM items i
    INNER JOIN votes uv ON uv.item_id = i.id AND uv.session_id = ? AND uv.choice = 'yes'
    LEFT JOIN votes v ON v.item_id = i.id
    GROUP BY i.id
    HAVING total_votes > 0 AND (yes_count * 100.0 / total_votes) >= ?
    ORDER BY (yes_count * 1.0 / total_votes) DESC
  `).all(sessionId, threshold);

  const matches = rows.map((r) => ({
    ...r,
    yes_rate: Math.round((r.yes_count / r.total_votes) * 100),
  }));

  res.json({ matches, threshold });
});

/** GET /analytics — basic metrics (stretch) */
app.get('/analytics', (_req, res) => {
  const totalSwipes = db.prepare('SELECT COUNT(*) AS n FROM votes').get().n;
  const sessions = db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n;
  const avgDecision = db.prepare(`
    SELECT AVG(decision_ms) AS avg_ms FROM swipe_events WHERE decision_ms IS NOT NULL
  `).get();

  res.json({
    totalSwipes,
    uniqueSessions: sessions,
    averageDecisionMs: avgDecision.avg_ms
      ? Math.round(avgDecision.avg_ms)
      : null,
  });
});

/** POST /admin/items — add movie without code change (stretch) */
app.post('/admin/items', (req, res) => {
  const adminKey = process.env.ADMIN_KEY || 'movie-match-dev';
  if (req.headers['x-admin-key'] !== adminKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { label, description, image_url: imageUrl } = req.body || {};
  if (!label || typeof label !== 'string' || label.length > 200) {
    return res.status(400).json({ error: 'label required (max 200 chars)' });
  }
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'description required' });
  }
  if (!imageUrl || typeof imageUrl !== 'string') {
    return res.status(400).json({ error: 'image_url required' });
  }

  const id = `movie-${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO items (id, label, description, image_url) VALUES (?, ?, ?, ?)
  `).run(id, label.trim(), description.trim(), imageUrl.trim());

  res.status(201).json({ id, label, description, image_url: imageUrl });
});

/** POST /session — create anonymous session */
app.post('/session', (_req, res) => {
  const id = uuidv4().replace(/-/g, '').slice(0, 24);
  touchSession(id);
  res.status(201).json({ sessionId: id });
});

app.get('/health', (_req, res) => {
  const items = db.prepare('SELECT COUNT(*) AS n FROM items').get().n;
  res.json({ ok: true, items });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Movie Match API listening on http://localhost:${PORT}`);
});
