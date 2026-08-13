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

interface AnnouncementBarProps {
  /** When true the bar slides up out of view (synced with Navbar scroll state) */
  hidden?: boolean;
}

export function AnnouncementBar({ hidden = false }: AnnouncementBarProps) {
  // Duplicate for seamless loop
  const track = [...ITEMS, ...ITEMS];

  return (
    <div
      className={`${styles.bar} ${hidden ? styles.hidden : ''}`}
      role="region"
      aria-label="Announcements"
    >
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
