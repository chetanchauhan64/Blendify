'use client';

import { motion } from 'framer-motion';
import { MapPin, Coffee, Leaf } from 'lucide-react';
import { staggerContainer, slideUp, viewportConfig } from '@/lib/animations';
import styles from './USPStrip.module.css';

const USPS = [
  {
    icon: <MapPin size={22} />,
    title: 'Proudly Made in India',
  },
  {
    icon: <Coffee size={22} />,
    title: 'Everyday Drinks, Made Better',
  },
  {
    icon: <Leaf size={22} />,
    title: 'Flavour Meets Function',
  },
];

export function USPStrip() {
  return (
    <section className={styles.section} aria-label="Our promises">
      <motion.div
        className={styles.grid}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {USPS.map((usp) => (
          <motion.div key={usp.title} variants={slideUp} className={styles.item}>
            <span className={styles.icon} aria-hidden="true">{usp.icon}</span>
            <span className={styles.title}>{usp.title}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
