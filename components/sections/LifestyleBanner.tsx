'use client';

/**
 * BLENDIFY — LifestyleBanner
 * Full-width editorial banner below hero.
 * Inspired by premium D2C lifestyle photography.
 * Warm coffee-machine + mug + beans environment.
 */

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Coffee, Leaf } from 'lucide-react';
import styles from './LifestyleBanner.module.css';

export function LifestyleBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* Left: Image */}
        <motion.div
          className={styles.imageCol}
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.imageWrapper}>
            <Image
              src="/images/lifestyle/barista.png"
              alt="Blendify Premium Coffee Experience — mug, machine and beans"
              fill
              sizes="(max-width: 768px) 100vw, 55vw"
              className={styles.image}
              priority
            />
            <div className={styles.imageOverlay} />
            {/* Floating accent badge */}
            <div className={styles.floatBadge}>
              <Coffee size={16} />
              <span>100% Arabica</span>
            </div>
          </div>
        </motion.div>

        {/* Right: Content */}
        <motion.div
          className={styles.contentCol}
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.eyebrow}>Premium Coffee Experience</span>

          <h2 className={styles.headline}>
            Your Everyday<br />
            <em>Premium Coffee</em><br />
            Experience
          </h2>

          <p className={styles.body}>
            Crafted from single-origin 100% Arabica beans. Naturally flavoured, no added sugar.
            The finest instant coffee, brewed in seconds — right in your kitchen.
          </p>

          {/* Feature pills */}
          <div className={styles.pills}>
            {[
              { icon: '☕', text: 'Hot or Iced' },
              { icon: '🌿', text: 'No Artificial Additives' },
              { icon: '⚡', text: 'Ready in 30 seconds' },
              { icon: '🎁', text: 'Free Gifts on Combos' },
            ].map(({ icon, text }) => (
              <span key={text} className={styles.pill}>
                {icon} {text}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className={styles.ctas}>
            <Link href="/shop" className={styles.ctaPrimary}>
              <Coffee size={16} />
              Shop Coffee
            </Link>
            <Link href="/shop?category=explore" className={styles.ctaSecondary}>
              <Leaf size={16} />
              Explore Flavours
            </Link>
          </div>

          {/* Decorative element */}
          <div className={styles.decorLine} />
        </motion.div>
      </div>
    </section>
  );
}
