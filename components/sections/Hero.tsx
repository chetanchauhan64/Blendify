'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { staggerContainer, slideUp, fadeIn } from '@/lib/animations';
import styles from './Hero.module.css';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.3, 0.6]);
  const textY          = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);

  return (
    <section ref={containerRef} className={styles.hero} aria-label="Hero">

      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.bgGradient} />
        <motion.div className={styles.overlay} style={{ opacity: overlayOpacity }} />
      </div>

      {/* Floating ambient dots */}
      <div className={styles.ambientDots} aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.dot}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3 + i * 0.7, repeat: Infinity, delay: i * 0.5 }}
            style={{ left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className={styles.content}
        style={{ y: textY }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow */}
        <motion.div variants={fadeIn} className={styles.eyebrow}>
          <span className={styles.eyebrowDot} />
          <span>100% Arabica &nbsp;·&nbsp; The Art of Coffee</span>
          <span className={styles.eyebrowDot} />
        </motion.div>

        {/* Heading */}
        <motion.h1 variants={slideUp} className={styles.heading}>
          BLEND<em className={styles.headingAccent}>IFY</em>
        </motion.h1>

        {/* Subheading */}
        <motion.p variants={slideUp} className={styles.sub}>
          Premium specialty coffee, sourced from the world's finest farms and roasted with obsessive care.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={slideUp} className={styles.actions}>
          <Link href="/shop" className={styles.btnPrimary}>
            Shop Collection
            <ArrowRight size={16} />
          </Link>
          <Link href="/collections" className={styles.btnOutline}>
            <Play size={14} fill="currentColor" />
            Explore Flavours
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeIn} className={styles.stats}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.stat}>
              <span className={styles.statNum}>{s.value}</span>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className={styles.scrollIndicator}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className={styles.scrollLine} />
        <span className={styles.scrollText}>Scroll</span>
      </motion.div>
    </section>
  );
}

const STATS = [
  { value: '50+',  label: 'Flavours' },
  { value: '10K+', label: 'Happy Sips' },
  { value: '100%', label: 'Arabica' },
  { value: '4.9★', label: 'Rating' },
];
