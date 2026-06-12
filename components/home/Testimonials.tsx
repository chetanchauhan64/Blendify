'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Testimonial } from '@/types';
import styles from './Testimonials.module.css';

interface Props { testimonials: Testimonial[]; }

export function Testimonials({ testimonials }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const t = testimonials[current];

  return (
    <section className={`section ${styles.section}`}>
      <div className="container container--narrow">
        <motion.div className={styles.header} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <span className="section-label">What They Say</span>
          <h2 className="section-title">Customer Stories</h2>
        </motion.div>

        <div className={styles.carousel}>
          <button className={styles.navBtn} onClick={prev} aria-label="Previous testimonial">
            <ChevronLeft size={20} />
          </button>

          <div className={styles.testimonialWrapper}>
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                className={styles.testimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>
                <blockquote className={styles.quote}>{'"'}{t.text}{'"'}</blockquote>
                <div className={styles.author}>
                  <div className={styles.authorAvatar}>
                    {t.authorName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className={styles.authorName}>{t.authorName}</p>
                    <p className={styles.authorTitle}>{t.authorTitle}</p>
                    {t.productName && (
                      <p className={styles.productRef}>Reviewed: {t.productName}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <button className={styles.navBtn} onClick={next} aria-label="Next testimonial">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Dots */}
        <div className={styles.dots} role="tablist" aria-label="Testimonial navigation">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              onClick={() => setCurrent(i)}
              role="tab"
              aria-selected={i === current}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
