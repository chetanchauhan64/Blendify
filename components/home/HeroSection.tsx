'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import styles from './HeroSection.module.css';

const HERO_WORDS = ['THE', 'ART', 'OF', 'COFFEE'];

export function HeroSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.3]);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);

  return (
    <section ref={containerRef} className={styles.hero} aria-label="Hero">
      {/* Background image with parallax */}
      <motion.div
        className={styles.bg}
        style={{ scale: imageScale, opacity: imageOpacity }}
      >
        <Image
          src="/images/hero/hero-main.png"
          alt="BLENDIFY — The Art of Coffee"
          fill
          priority
          style={{ objectFit: 'cover' }}
        />
        <div className={styles.bgOverlay} />
      </motion.div>

      {/* Ambient particles */}
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'easeInOut',
            }}
            style={{
              left: `${8 + i * 7.5}%`,
              top: `${60 + (i % 4) * 10}%`,
              width: `${3 + (i % 4)}px`,
              height: `${3 + (i % 4)}px`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div className={styles.content} style={{ y: textY }}>
        {/* Brand label */}
        <motion.div
          className={styles.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.labelDot} />
          BLENDIFY Premium Coffee
          <span className={styles.labelDot} />
        </motion.div>

        {/* Main headline */}
        <h1 className={styles.headline}>
          {HERO_WORDS.map((word, i) => (
            <motion.span
              key={word}
              className={styles.headlineWord}
              initial={{ opacity: 0, y: 60, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.9,
                delay: 0.4 + i * 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Tagline */}
        <motion.p
          className={styles.tagline}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          From highland farms to your ritual. Every cup, a masterpiece.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className={styles.ctas}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link href="/shop" id="hero-shop-cta" className={`btn btn--primary btn--lg ${styles.ctaPrimary}`}>
            Shop the Collection
            <ArrowRight size={18} />
          </Link>
          <Link href="/about" className={`btn btn--glass btn--lg`}>
            Our Story
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          className={styles.stats}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          {[
            { value: '12+', label: 'Origins' },
            { value: '50K+', label: 'Cups Served' },
            { value: '98%', label: 'Satisfaction' },
          ].map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className={styles.scrollIndicator}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
}
