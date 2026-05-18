/** Classic curved-arc swipe (backup — revert via swipeStyle.js) */

export const FLY_OFF_MS = 780;
export const SWIPE_THRESHOLD = 100;

export function getDragTransform(x, y) {
  const rot = x * 0.11 + y * 0.035;
  const arcY = y - Math.abs(x) * 0.1;
  const scale = 1 - Math.min(Math.hypot(x, y) / 1800, 0.05);
  return { x, y: arcY, rotate: rot, scale };
}

export function toTransform({ x, y, rotate, scale = 1 }) {
  return `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
}

function flyStartPose(rawX, rawY, dir) {
  const sign = dir === 'right' ? 1 : -1;
  const x = rawX === 0 && rawY === 0 ? sign * 36 : rawX;
  const y = rawX === 0 && rawY === 0 ? -8 : rawY;
  return getDragTransform(x, y);
}

export function animateArcFlyOff(el, flyOff) {
  const { x: rawX, y: rawY, dir } = flyOff;
  const start = flyStartPose(rawX, rawY, dir);
  const { x: x0, y: y0, rotate: startRot, scale: startScale } = start;
  const sign = dir === 'right' ? 1 : -1;
  const w = window.innerWidth;
  const h = window.innerHeight;

  const x1 = x0 + sign * w * 0.22;
  const y1 = y0 - 72;
  const r1 = startRot + sign * 14;

  const x2 = x0 + sign * w * 0.55;
  const y2 = y0 - 28;
  const r2 = startRot + sign * 20;

  const x3 = x0 + sign * w * 1.35;
  const y3 = y0 + h * 0.1;
  const r3 = sign * 32;

  return el.animate(
    [
      { transform: toTransform({ x: x0, y: y0, rotate: startRot, scale: startScale }) },
      {
        transform: toTransform({ x: x1, y: y1, rotate: r1, scale: 1.02 }),
        offset: 0.25,
      },
      {
        transform: toTransform({ x: x2, y: y2, rotate: r2, scale: 1 }),
        offset: 0.55,
      },
      {
        transform: toTransform({ x: x3, y: y3, rotate: r3, scale: 0.94 }),
      },
    ],
    {
      duration: FLY_OFF_MS,
      easing: 'cubic-bezier(0.25, 0.85, 0.35, 1)',
      fill: 'forwards',
    }
  );
}

export function getFlyStartTransform(flyOff) {
  if (!flyOff) return { x: 0, y: 0, rotate: 0, scale: 1 };
  return flyStartPose(flyOff.x, flyOff.y, flyOff.dir);
}

export function animateSpringBack(el, from) {
  const { x, y } = from;
  const start = getDragTransform(x, y);

  return el.animate(
    [
      { transform: toTransform({ ...start }) },
      { transform: toTransform({ x: 0, y: 0, rotate: 0, scale: 1 }) },
    ],
    {
      duration: 520,
      easing: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
      fill: 'forwards',
    }
  );
}

