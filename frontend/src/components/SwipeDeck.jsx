import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import MovieCard from './MovieCard';
import { useSwipe } from '../hooks/useSwipe';
import { postVote, undoLastVote } from '../api';
import PosterImage from './PosterImage';
import { isTinderSwipe } from '../config/swipeStyle';

function getBehindStyle(progress, isPromoting) {
  const scale = 0.94 + 0.06 * progress;
  const ty = 12 * (1 - progress);
  const opacity = 0.52 + 0.48 * progress;
  const brightness = 0.62 + 0.38 * progress;

  return {
    transform: `scale(${scale}) translateY(${ty}px)`,
    opacity,
    filter: `brightness(${brightness})`,
    transition: isPromoting
      ? 'transform 0.32s cubic-bezier(0.15, 0.85, 0.25, 1), opacity 0.28s ease, filter 0.28s ease'
      : 'none',
  };
}

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
  const [flyOff, setFlyOff] = useState(null);
  const [error, setError] = useState(null);
  const [undoing, setUndoing] = useState(false);
  const cardShownAt = useRef(Date.now());
  const pullStartY = useRef(null);
  const flyMovieIdRef = useRef(null);

  useEffect(() => {
    setQueue(items);
    cardShownAt.current = Date.now();
  }, [items]);

  const current = queue[0];
  const isAnimating = Boolean(flyOff);

  const handleFlyComplete = useCallback(() => {
    const id = flyMovieIdRef.current;
    if (id == null) return;

    setQueue((q) => (q[0]?.id === id ? q.slice(1) : q));
    setFlyOff(null);
    flyMovieIdRef.current = null;
    cardShownAt.current = Date.now();
    onVoteComplete?.();
  }, [onVoteComplete]);

  const castVote = useCallback(
    async (choice, dragSnapshot = { x: 0, y: 0 }) => {
      if (!current || isAnimating) return;

      const dir = choice === 'yes' ? 'right' : 'left';
      const movie = current;
      const decisionMs = Date.now() - cardShownAt.current;

      flyMovieIdRef.current = movie.id;
      setFlyOff({ dir, x: dragSnapshot.x, y: dragSnapshot.y });
      setError(null);

      try {
        await postVote({
          itemId: movie.id,
          choice,
          sessionId,
          decisionMs,
        });
      } catch (err) {
        if (err.status === 409) {
          return;
        }
        setFlyOff(null);
        flyMovieIdRef.current = null;
        setError(err.message || 'Vote failed');
      }
    },
    [current, isAnimating, sessionId]
  );

  const swipe = useSwipe({
    onSwipeLeft: (snap) => castVote('no', snap),
    onSwipeRight: (snap) => castVote('yes', snap),
  });

  const behindProgress = isAnimating ? 1 : swipe.stackProgress;
  const behindStyle = useMemo(
    () => getBehindStyle(behindProgress, isAnimating),
    [behindProgress, isAnimating]
  );

  const handleUndo = async () => {
    setUndoing(true);
    setError(null);
    try {
      await undoLastVote(sessionId);
      await onRefresh?.();
      setUndoing(false);
    } catch (err) {
      setError(err.message || 'Nothing to undo');
      setUndoing(false);
    }
  };

  const handlePointerStart = (e) => {
    if (isAnimating) return;
    const pt = e.touches?.[0] ?? e;
    pullStartY.current = pt.clientY;
    if (e.touches) swipe.handlers.onTouchStart(e);
    else swipe.handlers.onMouseDown(e);
  };

  const handlePointerMove = (e) => {
    if (isAnimating) return;
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
    if (isAnimating) return;
    pullStartY.current = null;
    if (e.type === 'touchend') swipe.handlers.onTouchEnd();
    else swipe.handlers.onMouseUp();
  };

  if (!current && !isAnimating) {
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
  const deckClass = `swipe-deck${isTinderSwipe ? ' swipe-deck--tinder' : ''}`;

  return (
    <div className={deckClass}>
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

      <div className={`card-stack${isAnimating ? ' is-promoting' : ''}`}>
        {queue[1] && (
          <div className="movie-card card-behind" style={behindStyle} aria-hidden>
            <PosterImage movie={queue[1]} />
          </div>
        )}

        {current && (
          <MovieCard
            key={current.id}
            movie={current}
            drag={swipe.drag}
            motion={swipe.motion}
            yesOpacity={swipe.yesOpacity}
            noOpacity={swipe.noOpacity}
            flyOff={flyOff}
            onFlyComplete={handleFlyComplete}
            onSpringDone={swipe.clearReturning}
            tinderMode={isTinderSwipe}
            handlers={{
              onTouchStart: handlePointerStart,
              onTouchMove: handlePointerMove,
              onTouchEnd: handlePointerEnd,
              onMouseDown: handlePointerStart,
              onMouseMove: handlePointerMove,
              onMouseUp: handlePointerEnd,
              onMouseLeave: swipe.handlers.onMouseLeave,
            }}
          />
        )}
      </div>

      <div className="action-row">
        <button
          type="button"
          className="btn-vote btn-no"
          onClick={() => castVote('no')}
          disabled={isAnimating}
          aria-label="Vote no"
        >
          ✕
        </button>
        <button
          type="button"
          className="btn-undo"
          onClick={handleUndo}
          disabled={undoing || voted === 0 || isAnimating}
          title="Undo last swipe"
        >
          ↩
        </button>
        <button
          type="button"
          className="btn-vote btn-yes"
          onClick={() => castVote('yes')}
          disabled={isAnimating}
          aria-label="Vote yes"
        >
          ♥
        </button>
      </div>
      <p className="pull-hint">Swipe down or tap Results for rankings</p>
    </div>
  );
}
