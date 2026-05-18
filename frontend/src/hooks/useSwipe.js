import { SWIPE_STYLE } from '../config/swipeStyle.js';
import { useSwipeClassic } from './useSwipe.classic.js';
import { useSwipeTinder } from './useSwipe.tinder.js';

export function useSwipe(opts) {
  const hook = SWIPE_STYLE === 'tinder' ? useSwipeTinder : useSwipeClassic;
  return hook(opts);
}
