'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './HeroSlider.module.css';

// ── Image-based Slide Data ───────────────────────────────────────
// The 4 Blendify promotional hero banners are used as full-bleed
// slide backgrounds. All copy/CTAs are baked into the supplied
// images — no overlay text is rendered.
// ────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    src: '/images/hero/hero-slide-1.png',
    alt: 'Bundle and Save Offer — Any 2 50g jars at Rs 799 | Any 50g jar + Guilt Free Iced Tea at Rs 749',
    href: '/shop',
  },
  {
    id: 2,
    src: '/images/hero/hero-slide-2.png',
    alt: 'Shop for Rs 1999 and get our Guava Chilli Iced Tea Free',
    href: '/shop',
  },
  {
    id: 3,
    src: '/images/hero/hero-slide-3.png',
    alt: "India's Largest Variety of Instant Coffees in Sachets",
    href: '/shop',
  },
  {
    id: 4,
    src: '/images/hero/hero-slide-4.png',
    alt: 'Buy Bundles and Save Up To 40%',
    href: '/collections/bundles',
  },
] as const;

const AUTOPLAY_MS  = 5500;   // 5.5s per slide

// ── Component ───────────────────────────────────────────────────
export function HeroSlider() {
  const [current, setCurrent]   = useState(0);
  const [paused, setPaused]     = useState(false);
  const [hovered, setHovered]   = useState(false);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX             = useRef(0);

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), []);
  const goTo = useCallback((i: number) => setCurrent(i), []);

  // Autoplay — 5.5s per slide, pauses on hover
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
  };

  const slide = SLIDES[current];

  return (
    <section
      className={styles.slider}
      aria-label="Hero Banner Slider"
      onMouseEnter={() => { setPaused(true);  setHovered(true);  }}
      onMouseLeave={() => { setPaused(false); setHovered(false); }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Crossfade image slides ───────────────────────────── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`slide-${slide.id}`}
          className={styles.slideFrame}
          initial={{ opacity: 0, scale: 1.012 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href={slide.href}
            className={styles.slideLink}
            tabIndex={-1}
            aria-label={slide.alt}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={slide.id === 1}
              sizes="100vw"
              className={styles.slideImage}
              quality={92}
              draggable={false}
            />
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* ── Left/Right Arrow Navigation (hover-reveal) ────────── */}
      <AnimatePresence>
        {hovered && (
          <>
            <motion.button
              key="prev-arrow"
              className={`${styles.navArrow} ${styles.navPrev}`}
              onClick={(e) => { e.preventDefault(); prev(); }}
              aria-label="Previous slide"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              <ChevronLeft size={22} />
            </motion.button>
            <motion.button
              key="next-arrow"
              className={`${styles.navArrow} ${styles.navNext}`}
              onClick={(e) => { e.preventDefault(); next(); }}
              aria-label="Next slide"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              <ChevronRight size={22} />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* ── Always-visible dot navigation ─────────────────────── */}
      <div className={styles.dotNav} aria-label="Slide navigation" role="tablist">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.dot} ${current === i ? styles.dotActive : ''}`}
            onClick={(e) => { e.preventDefault(); goTo(i); }}
            aria-label={`Go to slide ${s.id}`}
            aria-selected={current === i}
            role="tab"
          />
        ))}
      </div>

      {/* ── Screen reader live region ─────────────────────────── */}
      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        Slide {current + 1} of {SLIDES.length}: {slide.alt}
      </div>
    </section>
  );
}
