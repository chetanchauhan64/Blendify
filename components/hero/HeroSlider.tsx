'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './HeroSlider.module.css';

const SLIDES = [
  { id: 1, image: '/images/hero/banner-1.png', alt: 'Buy Any 3 Coffees Get Hot Chocolate Free' },
  { id: 2, image: '/images/hero/banner-2.png', alt: 'Blendify Premium Coffee Bundle Offer' },
  { id: 3, image: '/images/hero/banner-3.png', alt: "India's Largest Variety in Sachets" },
  { id: 4, image: '/images/hero/banner-4.png', alt: 'Guilt Free Hydration Iced Tea' },
];

const AUTOPLAY_MS = 5000;

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), []);
  const goTo = useCallback((i: number) => setCurrent(i), []);

  // Autoplay
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
  };

  return (
    <section
      className={styles.slider}
      aria-label="Hero Banner Slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides — all rendered, only active one visible */}
      <div className={styles.track}>
        {SLIDES.map((slide, i) => (
          <div
            key={slide.id}
            className={`${styles.slide} ${i === current ? styles.slideActive : ''}`}
            aria-hidden={i !== current}
          >
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              quality={90}
              className={styles.image}
            />
          </div>
        ))}
      </div>

      {/* Nav dots — bottom right, exactly like Impulse Coffee */}
      <nav className={styles.nav} aria-label="Slide navigation">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === current ? 'true' : undefined}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      {/* Screen reader live region */}
      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        Slide {current + 1} of {SLIDES.length}: {SLIDES[current].alt}
      </div>
    </section>
  );
}
