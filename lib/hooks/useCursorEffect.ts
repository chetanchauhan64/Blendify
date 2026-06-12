'use client';
import { useState, useCallback, useRef, useEffect } from 'react';

export type CursorSide = 'left' | 'right' | 'center';

export function useCursorEffect(containerRef: React.RefObject<HTMLElement | null>) {
  const [side, setSide] = useState<CursorSide>('center');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const third = rect.width / 3;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY });
        setSide(x < third ? 'left' : x > third * 2 ? 'right' : 'center');
      });
    },
    [containerRef],
  );

  const onEnter = useCallback(() => setVisible(true), []);
  const onLeave = useCallback(() => { setVisible(false); setSide('center'); }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [containerRef, onMouseMove, onEnter, onLeave]);

  return { side, pos, visible };
}
