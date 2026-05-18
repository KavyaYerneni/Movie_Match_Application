import { useState, useCallback, useRef, useEffect } from 'react';
import MovieCard from './MovieCard';
import { useSwipe } from '../hooks/useSwipe';
import { postVote, undoLastVote } from '../api';

export default function SwipeDeck({
  items,
  sessionId,
  total,
  voted,
  onVoteComplete,
  onShowResults,
  onRefresh,
}) {
  const [queue, setQueue] = useState(items);
  const [exiting, setExiting] = useState(false);
  const [error, setError] = useState(null);
  const [undoing, setUndoing] = useState(false);
  const cardShownAt = useRef(Date.now());
  const pullStartY = useRef(null);

  useEffect(() => {
    setQueue(items);
    cardShownAt.current = Date.now();
  }, [items]);

  const current = queue[0];

  const castVote = useCallback(
    async (choice) => {
      if (!current || exiting) return;
      setExiting(true);
      setError(null);
      const decisionMs = Date.now() - cardShownAt.current;
      try {
        await postVote({
          itemId: current.id,
          choice,
          sessionId,
          decisionMs,
        });
        setTimeout(() => {
          setQueue((q) => q.slice(1));
          setExiting(false);
          cardShownAt.current = Date.now();
          onVoteComplete?.();
        }, 320);
      } catch (err) {
        setExiting(false);
        if (err.status === 409) {
          setQueue((q) => q.slice(1));
          onVoteComplete?.();
        } else {
          setError(err.message || 'Vote failed');
        }
      }
    },
    [current, exiting, sessionId, onVoteComplete]
  );

  const swipe = useSwipe({
    onSwipeLeft: () => castVote('no'),
    onSwipeRight: () => castVote('yes'),
  });

  const handleUndo = async () => {
    setUndoing(true);
    setError(null);
    try {
      const { undone } = await undoLastVote(sessionId);
      await onRefresh?.();
      setUndoing(false);
    } catch (err) {
      setError(err.message || 'Nothing to undo');
      setUndoing(false);
    }
  };

  const handlePointerStart = (e) => {
    const pt = e.touches?.[0] ?? e;
    pullStartY.current = pt.clientY;
    if (e.touches) swipe.handlers.onTouchStart(e);
    else swipe.handlers.onMouseDown(e);
  };

  const handlePointerMove = (e) => {
    const pt = e.touches?.[0] ?? e;
    const y = pt.clientY;
    if (
      pullStartY.current != null &&
      y - pullStartY.current > 80 &&
      Math.abs(swipe.drag.x) < 40
    ) {
      onShowResults?.();
      pullStartY.current = null;
      return;
    }
    if (e.touches) swipe.handlers.onTouchMove(e);
    else swipe.handlers.onMouseMove(e);
  };

  const handlePointerEnd = (e) => {
    pullStartY.current = null;
    if (e.type === 'touchend') swipe.handlers.onTouchEnd();
    else swipe.handlers.onMouseUp();
  };

  if (!current) {
    return (
      <div className="end-deck">
        <span className="end-icon">🎬</span>
        <h2>You&apos;ve voted on everything!</h2>
        <p>See how the crowd ranked these films.</p>
        <button type="button" className="btn-primary" onClick={onShowResults}>
          View Results
        </button>
      </div>
    );
  }

  const progress = total > 0 ? voted + 1 : 0;

  return (
    <div className="swipe-deck">
      <div className="progress-bar">
        <span>
          {progress} / {total} movies
        </span>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${total ? (voted / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <div className="card-stack">
        {queue[1] && (
          <div className="movie-card card-behind" aria-hidden>
            <img src={queue[1].image_url} alt="" className="card-poster" />
          </div>
        )}
        <MovieCard
          movie={current}
          drag={swipe.drag}
          rotate={swipe.rotate}
          yesOpacity={swipe.yesOpacity}
          noOpacity={swipe.noOpacity}
          handlers={{
            onTouchStart: handlePointerStart,
            onTouchMove: handlePointerMove,
            onTouchEnd: handlePointerEnd,
            onMouseDown: handlePointerStart,
            onMouseMove: handlePointerMove,
            onMouseUp: handlePointerEnd,
            onMouseLeave: swipe.handlers.onMouseLeave,
          }}
          exiting={exiting}
        />
      </div>

      <div className="action-row">
        <button
          type="button"
          className="btn-vote btn-no"
          onClick={() => castVote('no')}
          disabled={exiting}
          aria-label="Vote no"
        >
          ✕
        </button>
        <button
          type="button"
          className="btn-undo"
          onClick={handleUndo}
          disabled={undoing || voted === 0}
          title="Undo last swipe"
        >
          ↩
        </button>
        <button
          type="button"
          className="btn-vote btn-yes"
          onClick={() => castVote('yes')}
          disabled={exiting}
          aria-label="Vote yes"
        >
          ♥
        </button>
      </div>
      <p className="pull-hint">Swipe down or tap Results for rankings</p>
    </div>
  );
}
