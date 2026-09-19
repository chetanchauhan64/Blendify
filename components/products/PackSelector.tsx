'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import styles from './PackSelector.module.css';
import type { PackOption } from '@/lib/data/iced-tea-profiles';

interface Props {
  options: PackOption[];
  onSelect?: (option: PackOption) => void;
}

export function PackSelector({ options, onSelect }: Props) {
  const [selected, setSelected] = useState<string>(options[0]?.id ?? '');

  const handleSelect = (opt: PackOption) => {
    setSelected(opt.id);
    onSelect?.(opt);
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.heading}>Our Range</p>
      <div className={styles.options}>
        {options.map((opt) => {
          const isActive = opt.id === selected;
          return (
            <button
              key={opt.id}
              type="button"
              className={`${styles.option} ${isActive ? styles.active : ''}`}
              onClick={() => handleSelect(opt)}
              aria-pressed={isActive}
              aria-label={`${opt.label} – ₹${opt.price.toLocaleString('en-IN')}`}
            >
              {/* Best Value badge */}
              {opt.bestValue && (
                <span className={styles.bestBadge}>Best Value</span>
              )}

              {/* Selected checkmark */}
              {isActive && (
                <span className={styles.checkmark} aria-hidden="true">
                  <Check size={12} strokeWidth={3} />
                </span>
              )}

              <div className={styles.optionLabel}>{opt.label}</div>

              <div className={styles.priceRow}>
                <span className={styles.price}>
                  ₹{opt.price.toLocaleString('en-IN')}
                </span>
                {opt.comparePrice && (
                  <span className={styles.comparePrice}>
                    ₹{opt.comparePrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {opt.saving && (
                <div className={styles.saving}>
                  Save ₹{opt.saving.toLocaleString('en-IN')}
                </div>
              )}

              <div className={styles.perServing}>
                ₹{opt.perServing}/serving
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
