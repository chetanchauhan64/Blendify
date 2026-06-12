'use client';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { SlideConfig } from '@/lib/slider-config';
import { TRANSITION_DURATION } from '@/lib/slider-config';
import styles from './HeroSlider.module.css';

interface HeroSlideProps {
  slide: SlideConfig;
  direction: 1 | -1;
  isActive: boolean;
}

const variants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : '-100%',
    scale: 1.08,
    opacity: 0,
    filter: 'blur(12px)',
  }),
  center: {
    x: '0%',
    scale: 1,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (dir: number) => ({
    x: dir > 0 ? '-100%' : '100%',
    scale: 0.95,
    opacity: 0,
    filter: 'blur(8px)',
  }),
};

export function HeroSlide({ slide, direction, isActive }: HeroSlideProps) {
  return (
    <motion.div
      key={slide.id}
      className={styles.slide}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        duration: TRANSITION_DURATION,
        ease: [0.77, 0, 0.18, 1],
      }}
      aria-hidden={!isActive}
    >
      {/* Ambient colour glow behind the image */}
      <motion.div
        className={styles.ambientGlow}
        style={{ background: `radial-gradient(ellipse at 60% 50%, ${slide.accent}55 0%, transparent 70%)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      />

      {/* Slow Ken-Burns zoom while slide is active */}
      <motion.div
        className={styles.imageWrapper}
        initial={{ scale: 1.04 }}
        animate={{ scale: isActive ? 1 : 1.04 }}
        transition={{ duration: 6, ease: 'linear' }}
      >
        <Image
          src={slide.image}
          alt={slide.alt}
          fill
          priority={slide.id === 1}
          sizes="100vw"
          className={styles.image}
          quality={90}
        />
      </motion.div>

      {/* Cinematic vignette overlay */}
      <div className={styles.vignette} />

      {/* Floating particles */}
      <div className={styles.particles} aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className={styles.particle}
            style={{ left: `${12 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [0, -18, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
