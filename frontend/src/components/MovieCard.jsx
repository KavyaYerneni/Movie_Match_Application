import { useEffect, useRef, useState } from 'react';
import PosterImage from './PosterImage';
import {
  animateArcFlyOff,
  animateSpringBack,
  getFlyStartTransform,
  toTransform,
} from '../utils/cardMotion';

export default function MovieCard({
  movie,
  motion,
  drag,
  yesOpacity,
  noOpacity,
  handlers,
  flyOff,
  onSpringDone,
  onFlyComplete,
  tinderMode = false,
}) {
  const cardRef = useRef(null);
  const [flyAnimating, setFlyAnimating] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !flyOff) {
      setFlyAnimating(false);
      return;
    }

    const start = getFlyStartTransform(flyOff);
    el.style.transform = toTransform(start);

    let anim = null;
    let cancelled = false;

    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      setFlyAnimating(true);
      anim = animateArcFlyOff(el, flyOff);
      anim.onfinish = () => {
        if (cancelled) return;
        setFlyAnimating(false);
        onFlyComplete?.();
      };
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      anim?.cancel();
      setFlyAnimating(false);
    };
  }, [flyOff, onFlyComplete]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !drag.returning) return;

    const anim = animateSpringBack(el, { x: drag.x, y: drag.y });
    anim.onfinish = () => {
      el.style.transform = toTransform({ x: 0, y: 0, rotate: 0, scale: 1 });
      onSpringDone?.();
    };
    return () => anim.cancel();
  }, [drag.returning, drag.x, drag.y, onSpringDone]);

  const isFlying = Boolean(flyOff);

  let transform;
  if (isFlying && !flyAnimating) {
    transform = toTransform(getFlyStartTransform(flyOff));
  } else if (!isFlying) {
    transform = toTransform(motion);
  }

  const style = {
    ...(transform ? { transform } : {}),
    transition:
      isFlying || drag.active
        ? 'none'
        : drag.returning
          ? 'none'
          : 'transform 0.2s ease-out',
    pointerEvents: isFlying ? 'none' : 'auto',
  };

  const tint =
    drag.x > 24 || flyOff?.dir === 'right'
      ? `rgba(46, 213, 115, ${flyOff?.dir === 'right' ? 0.35 : yesOpacity * 0.4})`
      : drag.x < -24 || flyOff?.dir === 'left'
        ? `rgba(255, 71, 87, ${flyOff?.dir === 'left' ? 0.35 : noOpacity * 0.4})`
        : 'transparent';

  const stampYes = flyOff?.dir === 'right' ? 1 : yesOpacity;
  const stampNo = flyOff?.dir === 'left' ? 1 : noOpacity;

  const stampYesStyle = tinderMode
    ? { opacity: stampYes, transform: `rotate(12deg) scale(${0.85 + stampYes * 0.2})` }
    : { opacity: stampYes };

  const stampNoStyle = tinderMode
    ? { opacity: stampNo, transform: `rotate(-12deg) scale(${0.85 + stampNo * 0.2})` }
    : { opacity: stampNo };

  return (
    <div
      ref={cardRef}
      className={`movie-card${isFlying ? ' is-flying' : ''}${tinderMode ? ' movie-card--tinder' : ''}`}
      style={style}
      {...(isFlying ? {} : handlers)}
    >
      <div className="card-tint" style={{ background: tint }} />
      <div className="stamp stamp-yes" style={stampYesStyle}>
        WATCH
      </div>
      <div className="stamp stamp-no" style={stampNoStyle}>
        SKIP
      </div>
      <PosterImage movie={movie} />
      <div className="card-gradient" aria-hidden />
      <div className="card-info">
        {movie.year && <span className="card-year">{movie.year}</span>}
        {movie.genre && <span className="card-genre">{movie.genre}</span>}
        <h2 className="card-title">{movie.label}</h2>
        <p className="card-description">{movie.description}</p>
        {!tinderMode && (
          <div className="card-hint">
            <span className="hint-no">← Skip</span>
            <span className="hint-dot">·</span>
            <span className="hint-yes">Watch →</span>
          </div>
        )}
      </div>
    </div>
  );
}
