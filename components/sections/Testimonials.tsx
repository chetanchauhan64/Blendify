'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './Testimonials.module.css';

const REVIEWS = [
  { id: 1, name: 'Arjun Mehta',   role: 'Software Engineer',  rating: 5, text: 'Honestly the best instant coffee I have had. The hazelnut blend tastes like a proper café drink. No more overpriced lattes for me.' },
  { id: 2, name: 'Priya Sharma',  role: 'UI/UX Designer',     rating: 5, text: 'I design for a living, so aesthetics matter — but Spill The Beans nails both look AND taste. The packaging is chef\'s kiss.' },
  { id: 3, name: 'Rahul Nair',    role: 'Startup Founder',    rating: 5, text: 'My entire team runs on STB now. The Cold Brew Concentrate is insane — I make 10 cups from one bottle. Absolute value.' },
  { id: 4, name: 'Sneha Kulkarni',role: 'Content Creator',    rating: 5, text: 'I\'ve tried every trendy coffee brand and nothing compares. The Vanilla Latte instant is my go-to for late-night shoots.' },
  { id: 5, name: 'Dev Anand',     role: 'Freelance Developer', rating: 5, text: 'Discovered STB through a friend and ordered 3 flavours the same day. The Dark Roast hits different at 2 AM.' },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % REVIEWS.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + REVIEWS.length) % REVIEWS.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const review = REVIEWS[current];

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Testimonials</span>
          <h2 className={`section-title ${styles.title}`}>What They're Sipping</h2>
        </motion.div>

        <div
          className={styles.slider}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={review.id}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Quote className={styles.quoteIcon} size={36} />
              <p className={styles.reviewText}>{review.text}</p>
              <div className={styles.reviewer}>
                <div className={styles.avatar}>{review.name[0]}</div>
                <div>
                  <div className={styles.reviewerName}>{review.name}</div>
                  <div className={styles.reviewerRole}>{review.role}</div>
                </div>
                <div className={styles.stars}>
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className={styles.controls}>
            <button className={styles.navBtn} onClick={prev} aria-label="Previous review"><ChevronLeft size={20} /></button>
            <div className={styles.dots}>
              {REVIEWS.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`Review ${i + 1}`}
                />
              ))}
            </div>
            <button className={styles.navBtn} onClick={next} aria-label="Next review"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
