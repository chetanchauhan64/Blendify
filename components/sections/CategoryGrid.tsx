'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { staggerContainer, slideUp, imageZoom, viewportConfig } from '@/lib/animations';
import styles from './CategoryGrid.module.css';

const CATEGORIES = [
  { id: 'flavoured',    emoji: '✨', title: 'Flavoured Coffee', count: '12 Products', href: '/collections/flavoured', desc: 'Hazelnut · Vanilla · Caramel · More' },
  { id: 'dark-roast',  emoji: '🫘', title: 'Dark Roast',        count: '8 Products',  href: '/collections/dark-roast', desc: 'Bold · Rich · Intense' },
  { id: 'bundles',     emoji: '🎯', title: 'Bundles',           count: '6 Sets',       href: '/collections/bundles', desc: 'Best value. Mix & Match.' },
  { id: 'gifts',       emoji: '🎁', title: 'Gift Packs',        count: '5 Packs',      href: '/collections/gifts', desc: 'Perfect for every occasion.' },
];

export function CategoryGrid() {
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
          <span className="section-label">Categories</span>
          <h2 className={`section-title ${styles.title}`}>Browse by Mood</h2>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {CATEGORIES.map((cat) => (
            <motion.div key={cat.id} variants={slideUp}>
              <Link href={cat.href} className={styles.card}>
                <motion.div className={styles.cardBg} variants={imageZoom} initial="rest" whileHover="hover">
                  <span className={styles.emoji}>{cat.emoji}</span>
                </motion.div>
                <div className={styles.overlay} />
                <div className={styles.content}>
                  <span className={styles.count}>{cat.count}</span>
                  <h3 className={styles.cardTitle}>{cat.title}</h3>
                  <p className={styles.cardDesc}>{cat.desc}</p>
                  <span className={styles.cta}>Browse <ArrowUpRight size={13} /></span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
