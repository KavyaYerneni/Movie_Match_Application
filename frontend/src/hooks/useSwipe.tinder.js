import { useRef, useState, useCallback } from 'react';
import {
  getDragTransform,
  getStackProgress,
  SWIPE_THRESHOLD,
} from '../utils/cardMotion.tinder.js';

const VELOCITY_THRESHOLD = 0.42;

export function useSwipeTinder({ onSwipeLeft, onSwipeRight }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false, returning: false });
  const dragRef = useRef(drag);
  const start = useRef({ x: 0, y: 0, time: 0 });

  const updateDrag = useCallback((next) => {
    dragRef.current = next;
    setDrag(next);
  }, []);

  const onStart = useCallback(
    (clientX, clientY) => {
      start.current = { x: clientX, y: clientY, time: Date.now() };
      updateDrag({ x: 0, y: 0, active: true, returning: false });
    },
    [updateDrag]
  );

  const onMove = useCallback(
    (clientX, clientY) => {
      if (!start.current.time) return;
      updateDrag({
        x: clientX - start.current.x,
        y: clientY - start.current.y,
        active: true,
        returning: false,
      });
    },
    [updateDrag]
  );

  const onEnd = useCallback(() => {
    const snapshot = { ...dragRef.current };
    const { x, y } = snapshot;
    const elapsed = Math.max(Date.now() - start.current.time, 1);
    const velocity = x / elapsed;
    start.current = { x: 0, y: 0, time: 0 };

    const passed =
      Math.abs(x) >= SWIPE_THRESHOLD || Math.abs(velocity) >= VELOCITY_THRESHOLD;

    if (passed && x !== 0) {
      if (x > 0) onSwipeRight?.({ x, y });
      else onSwipeLeft?.({ x, y });
      updateDrag({ x: 0, y: 0, active: false, returning: false });
    } else {
      updateDrag({ x, y, active: false, returning: true });
    }
  }, [onSwipeLeft, onSwipeRight, updateDrag]);

  const clearReturning = useCallback(() => {
    updateDrag({ x: 0, y: 0, active: false, returning: false });
  }, [updateDrag]);

  const handlers = {
    onTouchStart: (e) => {
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    },
    onTouchMove: (e) => {
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    },
    onTouchEnd: () => onEnd(),
    onMouseDown: (e) => {
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    },
    onMouseMove: (e) => {
      if (!start.current.time) return;
      onMove(e.clientX, e.clientY);
    },
    onMouseUp: () => onEnd(),
    onMouseLeave: () => {
      if (start.current.time) onEnd();
    },
  };

  const motion = getDragTransform(drag.x, drag.y);
  const stackProgress = getStackProgress(drag.x);
  const yesOpacity = Math.min(Math.max(drag.x / SWIPE_THRESHOLD, 0), 1);
  const noOpacity = Math.min(Math.max(-drag.x / SWIPE_THRESHOLD, 0), 1);

  return {
    drag,
    motion,
    stackProgress,
    yesOpacity,
    noOpacity,
    handlers,
    clearReturning,
    threshold: SWIPE_THRESHOLD,
  };
}
