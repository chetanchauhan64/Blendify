'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { staggerContainer, slideUp, imageZoom, viewportConfig } from '@/lib/animations';
import styles from './FeaturedCollections.module.css';

const COLLECTIONS = [
  {
    id: 'instant',
    label: 'Ready in 30 Seconds',
    title: 'Instant Coffee',
    desc: 'Premium instant coffee that actually tastes like real coffee.',
    href: '/collections/instant',
    color: '#3D2D1E',
    accent: '#D4880A',
    emoji: '⚡',
  },
  {
    id: 'flavoured',
    label: 'Signature Series',
    title: 'Flavoured Coffee',
    desc: 'Hazelnut, Vanilla, Caramel — indulgence in every cup.',
    href: '/collections/flavoured',
    color: '#2A1F14',
    accent: '#E8B84B',
    emoji: '✨',
  },
  {
    id: 'bundles',
    label: 'Best Value',
    title: 'Bundles',
    desc: 'Mix and match your favourites. Save more, sip more.',
    href: '/collections/bundles',
    color: '#1E1A0F',
    accent: '#C4863A',
    emoji: '🎯',
  },
  {
    id: 'gifts',
    label: 'For Coffee Lovers',
    title: 'Gift Packs',
    desc: 'Beautifully curated gift sets for every occasion.',
    href: '/collections/gifts',
    color: '#2A1A10',
    accent: '#D4880A',
    emoji: '🎁',
  },
];

export function FeaturedCollections() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Collections</span>
          <h2 className={`section-title ${styles.title}`}>Find Your Perfect Brew</h2>
          <p className="section-subtitle">Every style, every mood — we have a coffee for that.</p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className={styles.grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {COLLECTIONS.map((col, i) => (
            <motion.div key={col.id} variants={slideUp} custom={i}>
              <Link href={col.href} className={styles.card} style={{ '--card-bg': col.color, '--card-accent': col.accent } as React.CSSProperties}>
                <motion.div className={styles.cardBg} variants={imageZoom} initial="rest" whileHover="hover">
                  <div className={styles.cardPattern} />
                  <span className={styles.emoji}>{col.emoji}</span>
                </motion.div>
                <div className={styles.cardOverlay} />
                <div className={styles.cardContent}>
                  <span className={styles.cardLabel}>{col.label}</span>
                  <h3 className={styles.cardTitle}>{col.title}</h3>
                  <p className={styles.cardDesc}>{col.desc}</p>
                  <div className={styles.cardCta}>
                    Shop Now <ArrowUpRight size={14} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
