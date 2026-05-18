export default function MovieCard({
  movie,
  drag,
  rotate,
  yesOpacity,
  noOpacity,
  handlers,
  exiting,
}) {
  const style = {
    transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg)`,
    transition: exiting
      ? 'transform 0.35s ease, opacity 0.35s ease'
      : drag.active
        ? 'none'
        : 'transform 0.2s ease',
    opacity: exiting ? 0 : 1,
  };

  const tint =
    drag.x > 30
      ? `rgba(46, 213, 115, ${yesOpacity * 0.35})`
      : drag.x < -30
        ? `rgba(255, 71, 87, ${noOpacity * 0.35})`
        : 'transparent';

  return (
    <div
      className={`movie-card ${exiting ? 'exiting' : ''}`}
      style={style}
      {...handlers}
    >
      <div className="card-tint" style={{ background: tint }} />
      <div className="stamp stamp-yes" style={{ opacity: yesOpacity }}>
        YES
      </div>
      <div className="stamp stamp-no" style={{ opacity: noOpacity }}>
        NO
      </div>
      <img
        src={movie.image_url}
        alt={movie.label}
        className="card-poster"
        draggable={false}
        onError={(e) => {
          e.target.src = `https://placehold.co/400x600/1a1a2e/eee?text=${encodeURIComponent(movie.label.slice(0, 16))}`;
        }}
      />
      <div className="card-body">
        <h2>{movie.label}</h2>
        <p>{movie.description}</p>
        <div className="card-hint">← No &nbsp;|&nbsp; Yes →</div>
      </div>
    </div>
  );
}
