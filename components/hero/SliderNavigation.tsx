'use client';
import { motion } from 'framer-motion';
import styles from './HeroSlider.module.css';

interface SliderNavigationProps {
  total: number;
  current: number;
  progress: number;
  onSelect: (i: number) => void;
}

export function SliderNavigation({ total, current, progress, onSelect }: SliderNavigationProps) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;

  return (
    <nav className={styles.nav} aria-label="Slide navigation">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const stroke = circumference - (progress / 100) * circumference;

        return (
          <button
            key={i}
            className={`${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}
            onClick={() => onSelect(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={isActive ? 'true' : undefined}
          >
            {/* SVG ring progress */}
            {isActive && (
              <svg
                className={styles.progressRing}
                width={36}
                height={36}
                viewBox="0 0 36 36"
                aria-hidden="true"
              >
                {/* Track */}
                <circle
                  cx={18}
                  cy={18}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={2}
                />
                {/* Progress fill — rotated to start from top */}
                <motion.circle
                  cx={18}
                  cy={18}
                  r={radius}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={stroke}
                  style={{ transformOrigin: '18px 18px', rotate: '-90deg' }}
                />
              </svg>
            )}
            <span className={styles.navNum}>{i + 1}</span>
          </button>
        );
      })}
    </nav>
  );
}
