'use client';

/**
 * BLENDIFY — FuelMarqueeSection
 *
 * Directly replaces LifestyleBanner.
 * Layout:
 *   1. Gold gradient benefits strip (3 USP items)
 *   2. Cream section: serif headline + sub-copy + two infinite marquee rows
 *
 * Reference: https://www.impulsecoffees.com/ — "Fuel your IMPULSE" section
 * Confirmed spec (from live inspection):
 *   - Benefits strip: gold gradient bg, 3 items, icon + text
 *   - Section bg: #F7E9D3 (cream)
 *   - h2: serif (Georgia), large, bold, dark maroon
 *   - Row 1: scrolls left, 28s
 *   - Row 2: scrolls right, 32s
 *   - Edges fade via CSS mask-image
 *   - Hover on row pauses animation
 *   - prefers-reduced-motion: disables animation
 */

import { MapPin, Coffee, Leaf } from 'lucide-react';
import styles from './FuelMarqueeSection.module.css';

const BENEFITS = [
  { icon: <MapPin size={16} />, label: 'Proudly Made in India' },
  { icon: <Coffee size={16} />, label: 'Everyday Brews, Made Better' },
  { icon: <Leaf size={16} />, label: 'Flavour Meets Function' },
];

// Row 1: scrolls left  (28s)
// Row 2: scrolls right (32s)
// Each list is duplicated in JSX to enable seamless CSS translateX(-50%) loop
const PILLS_ROW1 = [
  { emoji: '☕', text: '100% Arabica' },
  { emoji: '😊', text: 'No Added Sugar' },
  { emoji: '🌿', text: 'No Artificial Additives' },
  { emoji: '⚡', text: 'Ready in 30 Seconds' },
  { emoji: '🎁', text: 'Free Gifts on Combos' },
  { emoji: '🔥', text: 'Bold Flavours' },
  { emoji: '⭐', text: 'Naturally Flavoured' },
  { emoji: '❄️', text: 'Hot or Iced' },
];

const PILLS_ROW2 = [
  { emoji: '😍', text: 'Guilt Free' },
  { emoji: '🌱', text: 'Plant Based Flavouring' },
  { emoji: '☕', text: 'Brewed in Seconds' },
  { emoji: '⭐', text: 'Better Fuel' },
  { emoji: '😊', text: 'Low Calorie' },
  { emoji: '🔥', text: 'Bold Flavours' },
  { emoji: '❄️', text: 'Cold Brew Ready' },
  { emoji: '🎁', text: 'Free Gifts on Combos' },
];

function MarqueeRow({ pills, reverse }: { pills: typeof PILLS_ROW1; reverse?: boolean }) {
  // Duplicate pills for seamless infinite scroll
  const doubled = [...pills, ...pills];
  return (
    <div className={`${styles.marqueeRow} ${reverse ? styles.marqueeRowReverse : ''}`}>
      <div className={`${styles.marqueeTrack} ${reverse ? styles.marqueeTrackReverse : ''}`}>
        {doubled.map((pill, i) => (
          <span key={i} className={styles.pill}>
            <span className={styles.pillEmoji}>{pill.emoji}</span>
            {pill.text}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FuelMarqueeSection() {
  return (
    <>
      {/* ── 1. Benefits Strip ───────────────────────────────────── */}
      <div className={styles.benefitsStrip} aria-label="Our promises">
        <ul className={styles.benefitsList}>
          {BENEFITS.map(({ icon, label }) => (
            <li key={label} className={styles.benefitItem}>
              <span className={styles.benefitIcon} aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 2. Fuel Section ─────────────────────────────────────── */}
      <section className={styles.fuelSection} aria-labelledby="fuel-heading">
        <div className={styles.fuelInner}>
          <h2 id="fuel-heading" className={styles.headline}>
            Fuel your{' '}
            <em className={styles.headlineAccent}>BLEND</em>{' '}
            from your first sip to your last drop.
          </h2>
          <p className={styles.subCopy}>
            Taste-first functional products made with purposeful ingredients, and nothing unnecessary.
          </p>
        </div>

        <MarqueeRow pills={PILLS_ROW1} />
        <MarqueeRow pills={PILLS_ROW2} reverse />
      </section>
    </>
  );
}
