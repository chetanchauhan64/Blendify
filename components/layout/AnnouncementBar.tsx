'use client';

import styles from './AnnouncementBar.module.css';

const ITEMS = [
  'Up to 40% off on Money Saver Bundles',
  'Shop for Rs. 1999 & get the GUAVA CHILLI Free!',
  'Buy 2 & Get Free Shipping!',
  '100% Arabica Coffee',
  'Proudly Made in India',
];

interface AnnouncementBarProps {
  /** When true the bar slides up out of view (synced with Navbar scroll state) */
  hidden?: boolean;
}

export function AnnouncementBar({ hidden = false }: AnnouncementBarProps) {
  // Triple for perfectly seamless loop (CSS keyframe uses -33.33%)
  const track = [...ITEMS, ...ITEMS, ...ITEMS];

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
