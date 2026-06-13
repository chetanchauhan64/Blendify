'use client';

/**
 * BLENDIFY — Testimonials (Redesigned)
 * Large horizontal slider cards with auto-scroll, manual arrows, infinite loop
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './Testimonials.module.css';

const REVIEWS = [
  {
    id: 1,
    name: 'Arjun Mehta',
    role: 'Software Engineer',
    location: 'Bangalore',
    rating: 5,
    text: 'Honestly the best instant coffee I\'ve ever had. The hazelnut blend tastes like a proper café latte. No more overpriced coffee shops for me — Blendify is my daily ritual now.',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    role: 'UX Designer',
    location: 'Mumbai',
    rating: 5,
    text: 'I design for a living, so aesthetics matter to me — but Blendify nails both look AND taste. The packaging is gorgeous, and the Vanilla flavour is absolutely divine.',
  },
  {
    id: 3,
    name: 'Rahul Nair',
    role: 'Startup Founder',
    location: 'Hyderabad',
    rating: 5,
    text: 'My entire team runs on Blendify now. The Mocha is insane — rich, smooth, not bitter at all. Ordered 10 jars in one go. The delivery was super fast too!',
  },
  {
    id: 4,
    name: 'Sneha Kulkarni',
    role: 'Content Creator',
    location: 'Pune',
    rating: 5,
    text: 'I\'ve tried every trending coffee brand out there and nothing compares to Blendify. The Espresso Instant is my go-to for late-night content creation sessions.',
  },
  {
    id: 5,
    name: 'Dev Anand',
    role: 'Freelance Developer',
    location: 'Chennai',
    rating: 5,
    text: 'Discovered Blendify through a friend\'s reel and ordered three flavours the same day. The Caramel hits different at 2 AM while I\'m debugging production issues.',
  },
  {
    id: 6,
    name: 'Meera Joshi',
    role: 'Product Manager',
    location: 'Delhi',
    rating: 5,
    text: 'Blendify\'s Frother Pro changed my morning coffee game completely. The froth is café-quality. Combined with Hazelnut Instant — pure magic every morning.',
  },
];

export function Testimonials() {
  const [current, setCurrent]   = useState(0);
  const [paused, setPaused]     = useState(false);
  const [direction, setDirection] = useState(1);
  const total = REVIEWS.length;

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -60 : 60 }),
  };

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Testimonials</span>
          <h2 className={styles.title}>What Our Community Sips</h2>
          <p className={styles.subtitle}>Real reviews from Blendify Coffee lovers across India.</p>
        </motion.div>

        {/* Card slider */}
        <div
          className={styles.slider}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Navigation prev */}
          <button className={`${styles.navBtn} ${styles.navBtnPrev}`} onClick={prev} aria-label="Previous review">
            <ChevronLeft size={22} />
          </button>

          <div className={styles.cardTrack}>
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={REVIEWS[current].id}
                className={styles.card}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(88,19,18,0.14)' }}
              >
                <Quote className={styles.quoteIcon} size={40} />

                <div className={styles.stars}>
                  {[...Array(REVIEWS[current].rating)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" className={styles.starIcon} />
                  ))}
                </div>

                <p className={styles.reviewText}>"{REVIEWS[current].text}"</p>

                <div className={styles.reviewer}>
                  <div className={styles.avatarCircle}>
                    {REVIEWS[current].name[0]}
                  </div>
                  <div className={styles.reviewerInfo}>
                    <span className={styles.reviewerName}>{REVIEWS[current].name}</span>
                    <span className={styles.reviewerRole}>{REVIEWS[current].role} · {REVIEWS[current].location}</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation next */}
          <button className={`${styles.navBtn} ${styles.navBtnNext}`} onClick={next} aria-label="Next review">
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Dots */}
        <div className={styles.dots}>
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              aria-label={`Review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
