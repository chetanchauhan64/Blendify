'use client';

/**
 * BLENDIFY — ExploreBannerSlider
 *
 * Auto-rotating promotional banner slider shown on all Explore
 * product detail pages, below the purchase section.
 *
 * Banner assets verified from:
 *   /public/Assets/Explore Banner-Blendify/
 * Exact files (5 total):
 *   All_100gms_jar_Banner_Blendify.png
 *   Coffee_sachet_box_Banner_Blendify.png
 *   Frother_Banner_Blendify.png
 *   Iced_teas_Banner_2-Blendify.png
 *   Indulgence_without_Guilt_Blendify.png
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './ExploreBannerSlider.module.css';

// ── Verified banner assets — inspected from filesystem ──────────
const BANNERS = [
  {
    id: 1,
    src: '/Assets/Explore Banner-Blendify/All_100gms_jar_Banner_Blendify.png',
    alt: 'Blendify — All 100g Jars Collection',
  },
  {
    id: 2,
    src: '/Assets/Explore Banner-Blendify/Coffee_sachet_box_Banner_Blendify.png',
    alt: 'Blendify — Coffee Sachet Box',
  },
  {
    id: 3,
    src: '/Assets/Explore Banner-Blendify/Frother_Banner_Blendify.png',
    alt: 'Blendify — Frother Collection',
  },
  {
    id: 4,
    src: '/Assets/Explore Banner-Blendify/Iced_teas_Banner_2-Blendify.png',
    alt: 'Blendify — Guilt Free Iced Teas',
  },
  {
    id: 5,
    src: '/Assets/Explore Banner-Blendify/Indulgence_without_Guilt_Blendify.png',
    alt: 'Blendify — Indulgence Without Guilt',
  },
] as const;

const AUTOPLAY_MS   = 4000;
const FADE_DURATION = 0.6;

export function ExploreBannerSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const touchStartX           = useRef(0);
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % BANNERS.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + BANNERS.length) % BANNERS.length), []);
  const goTo = useCallback((i: number) => setCurrent(i), []);

  // Auto-advance — resets on each slide change or pause
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

  // Touch / swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 40) next();
    else if (delta < -40) prev();
  };

  const banner = BANNERS[current];

  return (
    <section
      className={styles.section}
      aria-label="Blendify Promotional Banners"
    >
      <div className={styles.inner}>

        {/* ── Slider ───────────────────────────────────────────── */}
        <div
          className={styles.sliderWrap}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Crossfade frame */}
          <div className={styles.frame} aria-live="polite">
            <AnimatePresence mode="sync">
              <motion.div
                key={`banner-${banner.id}`}
                className={styles.slide}
                initial={{ opacity: 0, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: FADE_DURATION, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src={banner.src}
                  alt={banner.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 1280px"
                  quality={90}
                  className={styles.bannerImg}
                  priority={banner.id === 1}
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Prev arrow */}
          <button
            className={`${styles.arrow} ${styles.arrowPrev}`}
            onClick={prev}
            aria-label="Previous banner"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>

          {/* Next arrow */}
          <button
            className={`${styles.arrow} ${styles.arrowNext}`}
            onClick={next}
            aria-label="Next banner"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Progress bar ─────────────────────────────────────── */}
        <div className={styles.progressTrack}>
          <motion.div
            key={`progress-${current}`}
            className={styles.progressFill}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: AUTOPLAY_MS / 1000, ease: 'linear' }}
          />
        </div>

        {/* ── Dot navigation ───────────────────────────────────── */}
        <div className={styles.dots} role="tablist" aria-label="Banner navigation">
          {BANNERS.map((b, i) => (
            <button
              key={b.id}
              className={`${styles.dot} ${current === i ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={current === i}
              aria-label={`Banner ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
