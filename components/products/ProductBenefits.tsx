'use client';

/**
 * BLENDIFY — ProductBenefits
 * 4-icon benefit strip for product pages.
 * Icons rendered in UI — never baked into images.
 */

import styles from './ProductBenefits.module.css';

const BENEFITS = [
  {
    id: 'pb-1',
    icon: '☕',
    title: 'Premium Coffee',
    subtitle: 'Gourmet Grade',
  },
  {
    id: 'pb-2',
    icon: '🌿',
    title: '100% Arabica',
    subtitle: 'Single Origin',
  },
  {
    id: 'pb-3',
    icon: '✨',
    title: 'No Artificial Flavours',
    subtitle: 'Natural Only',
  },
  {
    id: 'pb-4',
    icon: '📦',
    title: 'Freshly Packed',
    subtitle: 'Sealed at Source',
  },
];

export function ProductBenefits() {
  return (
    <div className={styles.strip}>
      {BENEFITS.map((b) => (
        <div key={b.id} className={styles.benefit}>
          <span className={styles.icon}>{b.icon}</span>
          <div className={styles.text}>
            <span className={styles.title}>{b.title}</span>
            <span className={styles.subtitle}>{b.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
