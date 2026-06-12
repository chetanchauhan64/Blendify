'use client';

import { motion } from 'framer-motion';
import { Leaf, Globe, Award, Clock, RefreshCw, HeartHandshake, Shield, Truck } from 'lucide-react';
import styles from './WhyChooseUs.module.css';

const VALUES = [
  { icon: Award, title: 'Specialty Grade Only', desc: 'Every coffee scores 86+ on the SCA scale. We never compromise on quality.' },
  { icon: Globe, title: 'Direct Trade', desc: 'We work directly with farmers, ensuring fair wages and transparent supply chains.' },
  { icon: Leaf, title: 'Sustainable Sourcing', desc: 'Environmental responsibility is built into every decision we make.' },
  { icon: Clock, title: 'Roasted Fresh', desc: 'Roasted weekly in small batches and shipped within 48 hours of roasting.' },
  { icon: RefreshCw, title: 'Subscribe & Save', desc: 'Never run out. Save up to 18% with flexible subscription plans.' },
  { icon: HeartHandshake, title: 'Satisfaction Guarantee', desc: '30-day happiness guarantee. If you\'re not in love, we\'ll make it right.' },
];

const TRUST_BADGES = [
  { icon: Shield, label: '100% Secure Payments' },
  { icon: Truck, label: 'Free Shipping ₹2,499+' },
  { icon: RefreshCw, label: 'Easy Returns' },
  { icon: Award, label: 'SCA Certified' },
];

export function WhyChooseUs() {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <motion.div className={styles.header} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <span className="section-label">Our Promise</span>
          <h2 className="section-title">Why BLENDIFY</h2>
          <p className="section-subtitle">We didn&apos;t set out to sell coffee. We set out to redefine what coffee could be.</p>
        </motion.div>

        <div className={styles.grid}>
          {VALUES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title} className={styles.card} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.08 }}>
              <div className={styles.iconWrapper}>
                <Icon size={24} />
              </div>
              <h3 className={styles.cardTitle}>{title}</h3>
              <p className={styles.cardDesc}>{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div className={styles.trustBadges} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className={styles.trustBadge}>
              <Icon size={20} />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
