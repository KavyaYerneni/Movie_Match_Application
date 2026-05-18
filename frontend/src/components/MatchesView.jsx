import { useEffect, useState } from 'react';
import { fetchMatches } from '../api';

export default function MatchesView({ sessionId, onBack }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const threshold = 60;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMatches(sessionId, threshold);
        if (!cancelled) setMatches(data.matches || []);
      } catch {
        if (!cancelled) setMatches([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <section className="matches-view">
      <header className="results-header">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Back
        </button>
        <h1>Your Matches</h1>
      </header>
      <p className="matches-sub">
        Films you liked that the crowd also loves ({threshold}%+ yes rate)
      </p>
      {loading ? (
        <p className="loading-text">Finding matches…</p>
      ) : matches.length === 0 ? (
        <p className="empty-text">
          Swipe right on films you love — matches appear when the community agrees.
        </p>
      ) : (
        <ul className="results-list">
          {matches.map((m) => (
            <li key={m.id} className="result-item">
              <img src={m.image_url} alt="" className="result-thumb" />
              <div className="result-meta">
                <strong>{m.label}</strong>
                <span className="yes-pct">{m.yes_rate}% community yes</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
