'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Collection } from '@/types';
import styles from './CollectionsGrid.module.css';

interface Props { collections: Collection[]; }

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};

export function CollectionsGrid({ collections }: Props) {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="section-label">Explore</span>
          <h2 className="section-title">Our Collections</h2>
          <p className="section-subtitle">
            Four distinct categories. Each with its own personality, story, and ritual.
          </p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          {collections.map((col) => (
            <motion.div key={col.id} variants={itemVariants}>
              <Link href={`/collections/${col.slug}`} className={styles.card} aria-label={col.name}>
                <div className={styles.cardImage}>
                  <Image
                    src={col.image}
                    alt={col.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className={styles.cardOverlay} />
                </div>
                <div className={styles.cardContent}>
                  <span className={styles.cardCount}>{col.productCount} Coffees</span>
                  <h3 className={styles.cardTitle}>{col.name}</h3>
                  <p className={styles.cardDesc}>{col.description}</p>
                  <span className={styles.cardCta}>
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
