import { useState, useEffect, useCallback } from 'react';
import SwipeDeck from './components/SwipeDeck';
import ResultsView from './components/ResultsView';
import MatchesView from './components/MatchesView';
import SkipsView from './components/SkipsView';
import { ensureSession, fetchItems } from './api';

const VIEWS = { swipe: 'swipe', results: 'results', matches: 'matches', skips: 'skips' };

export default function App() {
  const [view, setView] = useState(VIEWS.swipe);
  const [sessionId, setSessionId] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [voted, setVoted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState(null);

  const loadItems = useCallback(async (sid) => {
    const id = sid || sessionId;
    if (!id) return;
    const data = await fetchItems(id);
    setItems(data.items || []);
    setTotal(data.total ?? 0);
    setVoted(data.voted ?? 0);
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sid = await ensureSession();
        if (cancelled) return;
        setSessionId(sid);
        await loadItems(sid);
      } catch (err) {
        if (!cancelled) setBootError(err.message || 'Could not connect to API');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleVoteComplete = useCallback(() => {
    if (sessionId) loadItems(sessionId);
  }, [sessionId, loadItems]);

  const handleRefresh = useCallback(() => {
    if (sessionId) return loadItems(sessionId);
  }, [sessionId, loadItems]);

  if (loading) {
    return (
      <main className="app-shell">
        <div className="boot-screen">
          <div className="spinner" />
          <p>Loading Movie Match…</p>
        </div>
      </main>
    );
  }

  if (bootError) {
    return (
      <main className="app-shell">
        <div className="boot-screen error">
          <h1>Movie Match</h1>
          <p>{bootError}</p>
          <p className="hint">Start the API: <code>cd backend && npm start</code></p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <h1 className="logo">
          Movie Match
          <span className="logo-sub">Swipe · Vote · Discover</span>
        </h1>
        <div className="nav-tabs">
          <button
            type="button"
            className={view === VIEWS.swipe ? 'active' : ''}
            onClick={() => setView(VIEWS.swipe)}
          >
            Swipe
          </button>
          <button
            type="button"
            className={view === VIEWS.results ? 'active' : ''}
            onClick={() => setView(VIEWS.results)}
          >
            Results
          </button>
          <button
            type="button"
            className={view === VIEWS.matches ? 'active' : ''}
            onClick={() => setView(VIEWS.matches)}
          >
            Matches
          </button>
          <button
            type="button"
            className={view === VIEWS.skips ? 'active' : ''}
            onClick={() => setView(VIEWS.skips)}
          >
            My Skips
          </button>
        </div>
      </nav>

      {view === VIEWS.swipe && (
        <SwipeDeck
          items={items}
          sessionId={sessionId}
          total={total}
          voted={voted}
          onVoteComplete={handleVoteComplete}
          onShowResults={() => setView(VIEWS.results)}
          onRefresh={handleRefresh}
        />
      )}
      {view === VIEWS.results && (
        <ResultsView onBack={() => setView(VIEWS.swipe)} />
      )}
      {view === VIEWS.matches && sessionId && (
        <MatchesView sessionId={sessionId} onBack={() => setView(VIEWS.swipe)} />
      )}
      {view === VIEWS.skips && sessionId && (
        <SkipsView sessionId={sessionId} onBack={() => setView(VIEWS.swipe)} />
      )}
    </main>
  );
}
