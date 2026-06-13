'use client';

/**
 * BLENDIFY — StatsCounter
 * Animated 100% Pure Arabica + supporting stats
 * Intersection Observer + Framer Motion counter animation
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import styles from './StatsCounter.module.css';

interface StatItem {
  id: string;
  prefix?: string;
  value: number;
  suffix: string;
  label: string;
  isBig?: boolean;
}

const STATS: StatItem[] = [
  { id: 'arabica',   value: 100,   suffix: '%',  label: 'Pure Arabica Coffee',  isBig: true },
  { id: 'customers', value: 50000, suffix: '+',  label: 'Happy Customers'  },
  { id: 'flavours',  value: 10,    suffix: '+',  label: 'Unique Flavours'  },
  { id: 'rating',    value: 4.9,   suffix: '★',  label: 'Customer Rating'  },
];


function AnimatedNumber({ value, suffix, isBig }: { value: number; suffix: string; isBig?: boolean }) {
  const ref     = useRef<HTMLSpanElement>(null);
  const inView  = useInView(ref, { once: true, amount: 0.5 });
  const motVal  = useMotionValue(0);
  const spring  = useSpring(motVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(motVal, value, {
      duration: 2.5,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (value >= 1000) {
          setDisplay((v / 1000).toFixed(v >= value * 0.9 ? 0 : 1) + 'K');
        } else {
          setDisplay(
            value % 1 === 0
              ? Math.floor(v).toString()
              : v.toFixed(1)
          );
        }
      },
    });
    return () => ctrl.stop();
  }, [inView, value, motVal]);


  return (
    <span ref={ref} className={isBig ? styles.bigNumber : styles.statNumber}>
      {display}{suffix}
    </span>
  );
}

export function StatsCounter() {
  const [big, ...rest] = STATS;
  const sectionRef = useRef<HTMLElement>(null);
  const inView     = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section className={styles.section} ref={sectionRef}>
      <div className={styles.inner}>
        {/* Large 100% hero counter */}
        <motion.div
          className={styles.bigBlock}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatedNumber value={big.value} suffix={big.suffix} isBig />
          <p className={styles.bigLabel}>{big.label}</p>
        </motion.div>

        {/* Supporting stats row */}
        <motion.div
          className={styles.statsRow}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {rest.map((stat, i) => (
            <motion.div
              key={stat.id}
              className={styles.statCard}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.12 }}
            >
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              <span className={styles.statLabel}>{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.9 }}
          style={{ marginTop: 'var(--space-8, 2rem)', display: 'flex', justifyContent: 'center' }}
        >
          <Link href="/shop" className={styles.ctaBtn}>
            Shop All Coffee
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
