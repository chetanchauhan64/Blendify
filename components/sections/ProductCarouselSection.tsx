'use client';

/**
 * BLENDIFY — ProductCarouselSection
 * Shared carousel engine used by ExploreSection, BestsellingCombos,
 * and BestCoffeeSachets.
 *
 * Uses Embla Carousel v8 for:
 *  - Mouse drag
 *  - Touch swipe
 *  - Snap alignment
 *  - Smooth scroll
 *  - Prev/Next navigation
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { ProductShowcaseCard } from '@/components/products/ProductShowcaseCard';
import type { ShowcaseProduct } from '@/lib/data/showcase-products';
import { viewportConfig } from '@/lib/animations';
import styles from './ProductCarousel.module.css';

interface ProductCarouselSectionProps {
  /** Section title */
  title: string;
  /** Products to render */
  products: ShowcaseProduct[];
  /** Href for "View All" */
  viewAllHref: string;
  /** Use maroon background (Section 2) */
  dark?: boolean;
  /** Extra CSS class on the outer <section> */
  className?: string;
}

export function ProductCarouselSection({
  title,
  products,
  viewAllHref,
  dark = false,
  className = '',
}: ProductCarouselSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false,
  });

  const [prevDisabled, setPrevDisabled] = useState(true);
  const [nextDisabled, setNextDisabled] = useState(false);
  const [progress, setProgress]         = useState(0);

  /* ── Sync button state & progress bar ─────────────────────── */
  const syncState = useCallback(() => {
    if (!emblaApi) return;
    setPrevDisabled(!emblaApi.canScrollPrev());
    setNextDisabled(!emblaApi.canScrollNext());
    const scrollProgress = emblaApi.scrollProgress();
    setProgress(Math.max(0, Math.min(1, scrollProgress)) * 100);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select',       syncState);
    emblaApi.on('reInit',       syncState);
    emblaApi.on('scroll',       syncState);
    syncState();
    return () => {
      emblaApi.off('select',   syncState);
      emblaApi.off('reInit',   syncState);
      emblaApi.off('scroll',   syncState);
    };
  }, [emblaApi, syncState]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  /* ── Derived CSS classes ───────────────────────────────────── */
  const sectionClass = dark ? styles['section--maroon'] : styles.section;
  const titleClass   = dark ? `${styles.title} ${styles['title--light']}` : styles.title;
  const viewAllClass = dark ? `${styles.viewAll} ${styles['viewAll--light']}` : styles.viewAll;
  const navBtnClass  = dark ? `${styles.navBtn} ${styles['navBtn--light']}` : styles.navBtn;
  const progressWrapClass = dark
    ? `${styles.progressWrap} ${styles['progressWrap--light']}`
    : styles.progressWrap;
  const progressBarClass = dark
    ? `${styles.progressBar} ${styles['progressBar--light']}`
    : styles.progressBar;

  return (
    <section className={`${sectionClass} ${className}`}>
      <div className={styles.inner}>
        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className={titleClass}>{title}</h2>

          <Link href={viewAllHref} className={viewAllClass}>
            View all
            <span className={styles.viewAllArrow}>
              <ArrowRight size={14} />
            </span>
          </Link>
        </motion.div>

        {/* ── Embla viewport ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.emblaViewport} ref={emblaRef}>
            <div className={styles.emblaContainer}>
              {products.map((product) => (
                <div key={product.id} className={styles.emblaSlide}>
                  <ProductShowcaseCard product={product} dark={dark} />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Nav row ──────────────────────────────────────────── */}
        <div className={styles.navRow}>
          {/* Prev */}
          <button
            className={navBtnClass}
            onClick={scrollPrev}
            disabled={prevDisabled}
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Progress bar */}
          <div className={progressWrapClass}>
            <div
              className={progressBarClass}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Next */}
          <button
            className={navBtnClass}
            onClick={scrollNext}
            disabled={nextDisabled}
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
