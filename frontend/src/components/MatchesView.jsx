import { useEffect, useState } from 'react';
import { fetchMatches } from '../api';
import { getPosterUrl, posterFallbackDataUrl } from '../utils/poster';

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
        Films you want to watch that the crowd also loves ({threshold}%+ yes rate)
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
              <div className="result-thumb-wrap">
                <img
                  src={getPosterUrl(m)}
                  alt=""
                  className="result-thumb"
                  onError={(e) => {
                    e.target.src = posterFallbackDataUrl(m.label);
                  }}
                />
              </div>
              <div className="result-meta">
                <div className="result-tags">
                  {m.year && <span>{m.year}</span>}
                  {m.genre && <span>{m.genre}</span>}
                </div>
                <strong>{m.label}</strong>
                {m.description && (
                  <p className="result-desc">{m.description}</p>
                )}
                <span className="yes-pct">{m.yes_rate}% community yes</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
