import { useState } from 'react';
import { getPosterUrl, posterFallbackDataUrl } from '../utils/poster';

export default function PosterImage({ movie, className = '' }) {
  const [src, setSrc] = useState(() => getPosterUrl(movie));
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`poster-wrap ${className} ${loaded ? 'loaded' : ''}`}>
      {!loaded && <div className="poster-skeleton" aria-hidden />}
      <img
        src={src}
        alt={`${movie.label} poster`}
        className="card-poster"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!src.startsWith('data:')) {
            setSrc(posterFallbackDataUrl(movie.label));
          }
        }}
      />
    </div>
  );
}
