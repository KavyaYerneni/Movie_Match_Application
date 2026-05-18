import { useRef, useState, useCallback } from 'react';

const THRESHOLD = 100;

export function useSwipe({ onSwipeLeft, onSwipeRight }) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const dragRef = useRef(drag);
  const start = useRef({ x: 0, y: 0, time: 0 });

  const updateDrag = useCallback((next) => {
    dragRef.current = next;
    setDrag(next);
  }, []);

  const onStart = useCallback((clientX, clientY) => {
    start.current = { x: clientX, y: clientY, time: Date.now() };
    updateDrag({ x: 0, y: 0, active: true });
  }, [updateDrag]);

  const onMove = useCallback((clientX, clientY) => {
    if (!start.current.time) return;
    updateDrag({
      x: clientX - start.current.x,
      y: clientY - start.current.y,
      active: true,
    });
  }, [updateDrag]);

  const onEnd = useCallback(() => {
    const { x } = dragRef.current;
    updateDrag({ x: 0, y: 0, active: false });
    start.current = { x: 0, y: 0, time: 0 };

    if (Math.abs(x) >= THRESHOLD) {
      if (x > 0) onSwipeRight?.();
      else onSwipeLeft?.();
    }
  }, [onSwipeLeft, onSwipeRight, updateDrag]);

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

  const rotate = drag.x * 0.08;
  const yesOpacity = Math.min(Math.max(drag.x / THRESHOLD, 0), 1);
  const noOpacity = Math.min(Math.max(-drag.x / THRESHOLD, 0), 1);

  return { drag, rotate, yesOpacity, noOpacity, handlers, threshold: THRESHOLD };
}
