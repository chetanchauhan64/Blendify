'use client';

import Link from 'next/link';
import styles from './FlavorSelector.module.css';
import type { FlavourSibling } from '@/lib/data/iced-tea-profiles';

interface Props {
  siblings: FlavourSibling[];
  activeSlug: string;
}

export function FlavorSelector({ siblings, activeSlug }: Props) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>Flavour</p>
      <div className={styles.swatches}>
        {siblings.map((s) => {
          const isActive = s.slug === activeSlug;
          return (
            <Link
              key={s.slug}
              href={`/shop/${s.slug}`}
              className={`${styles.swatch} ${isActive ? styles.active : ''}`}
              style={{ '--swatch-bg': s.color } as React.CSSProperties}
              aria-label={`Select ${s.label} flavour`}
              aria-current={isActive ? 'page' : undefined}
            >
              {s.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
