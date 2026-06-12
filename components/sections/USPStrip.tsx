'use client';

import { motion } from 'framer-motion';
import { Leaf, MapPin, Award, Truck } from 'lucide-react';
import { staggerContainer, slideUp, viewportConfig } from '@/lib/animations';
import styles from './USPStrip.module.css';

const USPS = [
  {
    icon: <Award size={28} />,
    title: '100% Arabica',
    desc: 'Only the finest single-origin and blended arabica beans make the cut.',
  },
  {
    icon: <MapPin size={28} />,
    title: 'Made in India',
    desc: 'Proudly roasted and crafted in India, for Indian palates.',
  },
  {
    icon: <Leaf size={28} />,
    title: 'USDA Organic',
    desc: 'Certified organic. No pesticides, no shortcuts, just pure coffee.',
  },
  {
    icon: <Truck size={28} />,
    title: 'Fast Delivery',
    desc: 'Orders dispatched within 24 hours. Free shipping above ₹999.',
  },
];

export function USPStrip() {
  return (
    <section className={styles.section}>
      <div className={styles.line} />
      <motion.div
        className={`container ${styles.grid}`}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
      >
        {USPS.map((usp) => (
          <motion.div key={usp.title} variants={slideUp} className={styles.card}>
            <div className={styles.icon}>{usp.icon}</div>
            <h3 className={styles.title}>{usp.title}</h3>
            <p className={styles.desc}>{usp.desc}</p>
          </motion.div>
        ))}
      </motion.div>
      <div className={styles.line} />
    </section>
  );
}
