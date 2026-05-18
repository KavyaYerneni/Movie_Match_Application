const API = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getOrCreateSessionId() {
  const key = 'movie-match-session';
  let id = localStorage.getItem(key);
  if (id && /^[a-zA-Z0-9_-]{8,64}$/.test(id)) return id;
  id = null;
  return id;
}

export function saveSessionId(id) {
  localStorage.setItem('movie-match-session', id);
}

export async function ensureSession() {
  let id = getOrCreateSessionId();
  if (id) return id;
  const { sessionId } = await request('/session', { method: 'POST' });
  saveSessionId(sessionId);
  return sessionId;
}

export function fetchItems(sessionId) {
  return request(`/items?sessionId=${encodeURIComponent(sessionId)}`);
}

export function postVote({ itemId, choice, sessionId, decisionMs }) {
  return request('/vote', {
    method: 'POST',
    body: JSON.stringify({ itemId, choice, sessionId, decisionMs }),
  });
}

export function undoLastVote(sessionId) {
  return request(`/vote/last?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}

export function fetchResults(sort = 'most-loved') {
  return request(`/results?sort=${encodeURIComponent(sort)}`);
}

export function fetchMatches(sessionId, threshold = 60) {
  return request(
    `/matches?sessionId=${encodeURIComponent(sessionId)}&threshold=${threshold}`
  );
}

export function fetchAnalytics() {
  return request('/analytics');
}
