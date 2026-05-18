/**
 * Swipe animation style.
 *
 * - "classic" — curved arc style (default)
 * - "tinder"  — Tinder-like physics (set VITE_SWIPE_STYLE=tinder to try)
 */
export const SWIPE_STYLE = import.meta.env.VITE_SWIPE_STYLE || 'classic';

export const isTinderSwipe = SWIPE_STYLE === 'tinder';
