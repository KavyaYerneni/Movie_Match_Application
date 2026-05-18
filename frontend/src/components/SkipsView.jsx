import { useEffect, useState } from 'react';
import { fetchSkips } from '../api';
import { getPosterUrl, posterFallbackDataUrl } from '../utils/poster';

export default function SkipsView({ sessionId, onBack }) {
  const [skips, setSkips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSkips(sessionId);
        if (!cancelled) setSkips(data.skips || []);
      } catch {
        if (!cancelled) setSkips([]);
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
        <h1>My Skips</h1>
      </header>
      <p className="matches-sub">
        Movies <strong>you</strong> swiped left on (voted no). Community-wide skip rankings are under
        Results → <em>Most skipped</em>.
      </p>
      {loading ? (
        <p className="loading-text">Loading your skips…</p>
      ) : skips.length === 0 ? (
        <p className="empty-text">
          You haven&apos;t skipped any films yet. Swipe left or tap ✕ on the deck.
        </p>
      ) : (
        <ul className="results-list">
          {skips.map((m) => (
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
                {m.description && <p className="result-desc">{m.description}</p>}
                <span className="skip-pct">You voted: Skip</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
