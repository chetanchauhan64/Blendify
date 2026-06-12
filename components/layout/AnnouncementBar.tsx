'use client';

import styles from './AnnouncementBar.module.css';

const ITEMS = [
  '☕  FREE SHIPPING ABOVE ₹999',
  '✦  100% ARABICA COFFEE',
  '🔥  SEASONAL BLENDS NOW AVAILABLE',
  '✨  CRAFTED WITH OBSESSION',
  '⚡  BREW BETTER. LIVE BOLDER.',
  '🌱  USDA ORGANIC CERTIFIED',
  '🇮🇳  PROUDLY MADE IN INDIA',
  '🎁  FREE BREWING GUIDE WITH EVERY ORDER',
];

export function AnnouncementBar() {
  // Duplicate for seamless loop
  const track = [...ITEMS, ...ITEMS];

  return (
    <div className={styles.bar} role="region" aria-label="Announcements">
      <div className={styles.track} aria-hidden="true">
        {track.map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
