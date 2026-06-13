'use client';

/**
 * BLENDIFY — NutritionCarousel
 * Nutritional information carousel for product pages.
 * Inspired by Breakcage nutrition slides.
 * Desktop: horizontal table. Mobile: vertical scrollable.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './NutritionCarousel.module.css';

interface NutritionSlide {
  id: string;
  title: string;
  servingInfo: string;
  rows: { label: string; per100g: string; perServing: string; rda?: string }[];
}

const NUTRITION_SLIDES: NutritionSlide[] = [
  {
    id: 'ns-1',
    title: 'Nutritional Information',
    servingInfo: 'Serving Size: 2g (1 tsp) | Servings per 100g: 50',
    rows: [
      { label: 'Energy', per100g: '374 kcal', perServing: '7.5 kcal', rda: '< 1%' },
      { label: 'Protein', per100g: '12.2 g', perServing: '0.24 g', rda: '< 1%' },
      { label: 'Total Carbohydrates', per100g: '65.6 g', perServing: '1.31 g', rda: '< 1%' },
      { label: '  — Total Sugars', per100g: '3.1 g', perServing: '0.06 g', rda: '—' },
      { label: '  — Added Sugars', per100g: '0 g', perServing: '0 g', rda: '0%' },
      { label: 'Total Fat', per100g: '0.5 g', perServing: '0.01 g', rda: '< 1%' },
      { label: '  — Saturated Fat', per100g: '0.1 g', perServing: '0 g', rda: '0%' },
      { label: 'Dietary Fibre', per100g: '16.1 g', perServing: '0.32 g', rda: '1%' },
    ],
  },
  {
    id: 'ns-2',
    title: 'Minerals & Micronutrients',
    servingInfo: 'Serving Size: 2g (1 tsp) | Servings per 100g: 50',
    rows: [
      { label: 'Sodium', per100g: '72 mg', perServing: '1.4 mg', rda: '< 1%' },
      { label: 'Potassium', per100g: '3526 mg', perServing: '70.5 mg', rda: '2%' },
      { label: 'Magnesium', per100g: '327 mg', perServing: '6.5 mg', rda: '2%' },
      { label: 'Phosphorus', per100g: '383 mg', perServing: '7.7 mg', rda: '1%' },
      { label: 'Caffeine', per100g: '3050 mg', perServing: '61 mg', rda: '—' },
      { label: 'Cholesterol', per100g: '0 mg', perServing: '0 mg', rda: '0%' },
      { label: 'Trans Fat', per100g: '0 g', perServing: '0 g', rda: '0%' },
    ],
  },
  {
    id: 'ns-3',
    title: 'Ingredients & Allergens',
    servingInfo: '100% Arabica Freeze-Dried Instant Coffee with Natural Flavouring',
    rows: [
      { label: 'Coffee (Arabica)', per100g: '95.5%', perServing: '—', rda: '—' },
      { label: 'Natural Flavouring', per100g: '4.5%', perServing: '—', rda: '—' },
      { label: 'Allergens', per100g: 'None declared', perServing: '—', rda: '—' },
      { label: 'Gluten Free', per100g: 'Yes', perServing: '—', rda: '—' },
      { label: 'Vegan Friendly', per100g: 'Yes', perServing: '—', rda: '—' },
      { label: 'No Added Sugar', per100g: 'Yes', perServing: '—', rda: '—' },
      { label: 'No Preservatives', per100g: 'Yes', perServing: '—', rda: '—' },
    ],
  },
];

export function NutritionCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const total = NUTRITION_SLIDES.length;

  const goNext = () => {
    setDirection(1);
    setCurrent((c) => (c + 1) % total);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + total) % total);
  };

  const slide = NUTRITION_SLIDES[current];

  const variants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  };

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselHeader}>
        <h3 className={styles.carouselTitle}>Nutrition Facts</h3>
        <p className={styles.carouselSubtitle}>
          *%RDA values are based on a 2000 kcal diet. Individual requirements may vary.
        </p>
        {/* Tab navigation */}
        <div className={styles.tabs}>
          {NUTRITION_SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`${styles.tab} ${i === current ? styles.tabActive : ''}`}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.slideArea}>
        {/* Prev */}
        <button className={`${styles.navBtn} ${styles.navPrev}`} onClick={goPrev} aria-label="Previous">
          <ChevronLeft size={18} />
        </button>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={styles.slideContent}
          >
            <p className={styles.servingInfo}>{slide.servingInfo}</p>
            <div className={styles.table}>
              {/* Table header */}
              <div className={`${styles.tableRow} ${styles.tableHeader}`}>
                <span className={styles.cellLabel}>Nutrient</span>
                <span className={styles.cellVal}>Per 100g</span>
                <span className={styles.cellVal}>Per Serving</span>
                <span className={styles.cellRda}>%RDA*</span>
              </div>
              {/* Table rows */}
              {slide.rows.map((row, i) => (
                <div
                  key={row.label}
                  className={`${styles.tableRow} ${i % 2 === 0 ? styles.tableRowEven : ''}`}
                >
                  <span className={styles.cellLabel}>{row.label}</span>
                  <span className={styles.cellVal}>{row.per100g}</span>
                  <span className={styles.cellVal}>{row.perServing}</span>
                  <span className={styles.cellRda}>{row.rda ?? '—'}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next */}
        <button className={`${styles.navBtn} ${styles.navNext}`} onClick={goNext} aria-label="Next">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dots */}
      <div className={styles.dots}>
        {NUTRITION_SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
