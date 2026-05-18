import { useEffect, useState, useCallback } from 'react';
import { fetchResults, fetchAnalytics } from '../api';

const SORT_OPTIONS = [
  { value: 'most-loved', label: 'Most loved' },
  { value: 'most-hated', label: 'Most hated' },
  { value: 'most-divisive', label: 'Most divisive' },
  { value: 'most-voted', label: 'Most voted' },
];

export default function ResultsView({ onBack, pollMs = 8000 }) {
  const [sort, setSort] = useState('most-loved');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const load = useCallback(async () => {
    try {
      const [res, stats] = await Promise.all([
        fetchResults(sort),
        fetchAnalytics().catch(() => null),
      ]);
      setResults(res.results || []);
      if (stats) setAnalytics(stats);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return (
    <section className="results-view">
      <header className="results-header">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Swipe
        </button>
        <h1>Community Rankings</h1>
      </header>

      {analytics && (
        <div className="analytics-strip">
          <span>{analytics.totalSwipes} total swipes</span>
          <span>{analytics.uniqueSessions} sessions</span>
          {analytics.averageDecisionMs != null && (
            <span>~{analytics.averageDecisionMs}ms avg decision</span>
          )}
        </div>
      )}

      <div className="sort-row">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`chip ${sort === opt.value ? 'active' : ''}`}
            onClick={() => setSort(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && results.length === 0 ? (
        <p className="loading-text">Loading results…</p>
      ) : results.length === 0 ? (
        <p className="empty-text">No votes yet. Be the first to swipe!</p>
      ) : (
        <ul className="results-list">
          {results.map((r, i) => (
            <li key={r.id} className="result-item">
              <span className="rank">#{i + 1}</span>
              <img
                src={r.image_url}
                alt=""
                className="result-thumb"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="result-meta">
                <strong>{r.label}</strong>
                <span className="yes-pct">{r.yes_rate}% yes</span>
                <span className="vote-counts">
                  {r.yes_count} yes · {r.no_count} no
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
