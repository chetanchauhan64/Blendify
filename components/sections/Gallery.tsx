'use client';

import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';
import { staggerContainer, viewportConfig } from '@/lib/animations';
import styles from './Gallery.module.css';

// Mock gallery items — emoji + mood label
const GALLERY = [
  { id: 1, emoji: '☕', mood: 'Morning Ritual',    size: 'large' },
  { id: 2, emoji: '🫘', mood: 'Bean Selection',   size: 'small' },
  { id: 3, emoji: '🧊', mood: 'Cold Brew Vibes',  size: 'small' },
  { id: 4, emoji: '✨', mood: 'Premium Blends',   size: 'small' },
  { id: 5, emoji: '🌅', mood: 'Golden Hour Sip',  size: 'large' },
  { id: 6, emoji: '🎁', mood: 'Gift Ready',        size: 'small' },
  { id: 7, emoji: '⚡', mood: 'Power Up',          size: 'small' },
  { id: 8, emoji: '🌱', mood: 'Organic Sourced',  size: 'small' },
  { id: 9, emoji: '🔥', mood: 'Dark Roast',        size: 'small' },
];

export function Gallery() {
  return (
    <section className={`section--surface ${styles.section}`}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="section-label">@spillthebeans_in</span>
            <h2 className={`section-title ${styles.title}`}>Coffee in the Wild</h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.igLink}
          >
            <Share2 size={18} />
            Follow on Instagram
          </a>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {GALLERY.map((item, i) => (
            <motion.div
              key={item.id}
              className={`${styles.cell} ${item.size === 'large' ? styles.cellLarge : ''}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewportConfig}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className={styles.cellBg}>
                <span className={styles.cellEmoji}>{item.emoji}</span>
              </div>
              <div className={styles.cellOverlay}>
                <Share2 size={18} className={styles.igIcon} />
                <span className={styles.cellMood}>{item.mood}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
