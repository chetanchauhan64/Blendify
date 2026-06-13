'use client';

/**
 * BLENDIFY — PreparationSlider
 * Animated 4-step preparation guide for product pages.
 * Inspired by Breakcage preparation steps slider.
 * Steps: Open Pack → Add Water/Milk → Stir/Shake → Enjoy
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './PreparationSlider.module.css';

interface PrepStep {
  step: number;
  icon: string;
  title: string;
  description: string;
  tip: string;
}

const PREP_STEPS: PrepStep[] = [
  {
    step: 1,
    icon: '📦',
    title: 'Open Your Blendify Pack',
    description: 'Peel back the freshness seal on your jar or sachet. Enjoy the rich aroma that greets you — that\'s the promise of 100% premium Arabica.',
    tip: 'Tip: Store in a cool, dry place after opening.',
  },
  {
    step: 2,
    icon: '💧',
    title: 'Add Hot Water or Cold Milk',
    description: 'For hot coffee: Pour 180–200ml of water at 88–92°C. For iced coffee: Use 50ml hot water first, then add cold milk and ice.',
    tip: 'Tip: Avoid boiling water — it can make coffee bitter.',
  },
  {
    step: 3,
    icon: '🥄',
    title: 'Stir or Shake Well',
    description: 'Stir vigorously for 20–30 seconds until completely dissolved. For iced versions, shake in a sealed bottle or blender for maximum creaminess.',
    tip: 'Tip: Use the Blendify Frother for barista-grade foam!',
  },
  {
    step: 4,
    icon: '☕',
    title: 'Enjoy Your Perfect Cup',
    description: 'Sip, savour, and take a moment. Your Blendify is ready — rich, smooth, and crafted to make every morning (or evening) extraordinary.',
    tip: 'Tip: Customise with milk, oat milk, or whipped cream.',
  },
];

export function PreparationSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const total = PREP_STEPS.length;

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  const step = PREP_STEPS[current];

  const variants = {
    enter: (dir: number) => ({ x: dir * 80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -80, opacity: 0 }),
  };

  return (
    <div className={styles.slider}>
      {/* Section heading */}
      <div className={styles.sliderHeader}>
        <h3 className={styles.sliderTitle}>How to Brew Blendify</h3>
        <p className={styles.sliderSubtitle}>Ready in under 60 seconds</p>
      </div>

      {/* Step indicators */}
      <div className={styles.stepIndicators}>
        {PREP_STEPS.map((s, i) => (
          <button
            key={s.step}
            className={`${styles.stepIndicator} ${i === current ? styles.stepIndicatorActive : ''} ${i < current ? styles.stepIndicatorDone : ''}`}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            aria-label={`Step ${s.step}`}
          >
            <span className={styles.stepNum}>{i < current ? '✓' : s.step}</span>
          </button>
        ))}
        <div className={styles.stepLine}>
          <div
            className={styles.stepLineFill}
            style={{ width: `${(current / (total - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Slide content */}
      <div className={styles.slideWrap}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={styles.slide}
          >
            {/* Icon */}
            <div className={styles.stepIcon}>{step.icon}</div>

            {/* Step number */}
            <div className={styles.stepBadge}>Step {step.step} of {total}</div>

            {/* Title */}
            <h4 className={styles.stepTitle}>{step.title}</h4>

            {/* Description */}
            <p className={styles.stepDescription}>{step.description}</p>

            {/* Tip */}
            <div className={styles.tipBox}>
              <span className={styles.tipIcon}>💡</span>
              <span className={styles.tipText}>{step.tip}</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          className={`${styles.navBtn} ${styles.navBtnPrev}`}
          onClick={goPrev}
          aria-label="Previous step"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className={`${styles.navBtn} ${styles.navBtnNext}`}
          onClick={goNext}
          aria-label="Next step"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dot navigation */}
      <div className={styles.dots}>
        {PREP_STEPS.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
