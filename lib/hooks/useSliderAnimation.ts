'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AUTOPLAY_INTERVAL, SLIDES } from '@/lib/slider-config';

export function useSliderAnimation() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const total = SLIDES.length;

  const goTo = useCallback(
    (index: number, dir?: 1 | -1) => {
      setPrev(current);
      setDirection(dir ?? (index > current ? 1 : -1));
      setCurrent(index);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    [current],
  );

  const next = useCallback(() => goTo((current + 1) % total, 1), [current, goTo, total]);
  const prev_ = useCallback(() => goTo((current - 1 + total) % total, -1), [current, goTo, total]);

  // Progress ticker
  useEffect(() => {
    if (paused) return;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / AUTOPLAY_INTERVAL) * 100, 100);
      setProgress(pct);
      if (pct >= 100) next();
    }, 50);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [current, paused, next]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev_();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev_]);

  return { current, prev, direction, progress, paused, setPaused, goTo, next, prevSlide: prev_ };
}
