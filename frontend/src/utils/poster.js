/** Reliable poster URL with inline SVG fallback (always renders). */
export function getPosterUrl(movie) {
  if (movie?.image_url) return movie.image_url;
  const seed = encodeURIComponent(movie?.id || movie?.label || 'movie');
  return `https://picsum.photos/seed/${seed}/500/750`;
}

export function posterFallbackDataUrl(title = 'Film') {
  const safe = String(title).slice(0, 40).replace(/[<>&"']/g, '');
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750" viewBox="0 0 500 750">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0f3460"/>
    </linearGradient>
  </defs>
  <rect width="500" height="750" fill="url(#g)"/>
  <text x="250" y="380" text-anchor="middle" fill="#e94560" font-family="Georgia,serif" font-size="28" font-weight="bold">🎬</text>
  <text x="250" y="430" text-anchor="middle" fill="#f4f4f8" font-family="system-ui,sans-serif" font-size="22" font-weight="600">${safe}</text>
</svg>`.trim();
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
