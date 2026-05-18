/** Tinder-style swipe physics */

export const FLY_OFF_MS = 380;
export const SWIPE_THRESHOLD = 88;

const ROT_PER_PX = 1 / 12;
const Y_DAMP = 0.28;

export function getDragTransform(x, y) {
  const rotate = x * ROT_PER_PX;
  const dampY = y * Y_DAMP;
  return { x, y: dampY, rotate, scale: 1 };
}

export function getStackProgress(x, threshold = SWIPE_THRESHOLD) {
  return Math.min(Math.abs(x) / threshold, 1);
}

export function toTransform({ x, y, rotate, scale = 1 }) {
  return `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg) scale(${scale})`;
}

function flyStartPose(rawX, rawY, dir) {
  const sign = dir === 'right' ? 1 : -1;
  const x = rawX === 0 && rawY === 0 ? sign * 48 : rawX;
  const y = rawX === 0 && rawY === 0 ? 0 : rawY;
  return getDragTransform(x, y);
}

export function getFlyStartTransform(flyOff) {
  if (!flyOff) return { x: 0, y: 0, rotate: 0, scale: 1 };
  return flyStartPose(flyOff.x, flyOff.y, flyOff.dir);
}

/** Fast horizontal throw with Tinder-style rotation */
export function animateArcFlyOff(el, flyOff) {
  const { x: rawX, y: rawY, dir } = flyOff;
  const start = flyStartPose(rawX, rawY, dir);
  const { x: x0, y: y0, rotate: startRot } = start;
  const sign = dir === 'right' ? 1 : -1;
  const w = window.innerWidth;

  const exitX = x0 + sign * w * 1.4;
  const exitY = y0 + sign * 12;
  const exitRot = sign * 28;

  return el.animate(
    [
      { transform: toTransform({ x: x0, y: y0, rotate: startRot }) },
      {
        transform: toTransform({ x: exitX, y: exitY, rotate: exitRot, scale: 0.98 }),
      },
    ],
    {
      duration: FLY_OFF_MS,
      easing: 'cubic-bezier(0.15, 0.85, 0.25, 1)',
      fill: 'forwards',
    }
  );
}

export function animateSpringBack(el, from) {
  const start = getDragTransform(from.x, from.y);

  return el.animate(
    [
      { transform: toTransform({ ...start }) },
      { transform: toTransform({ x: 0, y: 0, rotate: 0, scale: 1 }) },
    ],
    {
      duration: 340,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards',
    }
  );
}
