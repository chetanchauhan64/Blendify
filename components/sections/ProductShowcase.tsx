'use client';

/**
 * BLENDIFY — ProductShowcase
 * Apple-level alternating product sections with parallax hover
 * Large editorial photography, premium spacing
 */

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './ProductShowcase.module.css';

interface ShowcaseItem {
  id: string;
  image: string;
  badge?: string;
  title: string;
  tagline: string;
  description: string;
  price: number;
  comparePrice?: number;
  rating: number;
  tags: string[];
  href: string;
  reverse?: boolean;
}

const SHOWCASE_PRODUCTS: ShowcaseItem[] = [
  {
    id: 'ps-1',
    image: '/showcase/frother.png',
    badge: 'NEW',
    title: 'Blendify Frother Pro',
    tagline: 'Café-Quality Foam. At Home.',
    description: 'Experience barista-level froth with our rechargeable Frother Pro. 3 foaming modes, premium stainless steel whisk, and a 60-second fast froth technology. Perfectly paired with any Blendify coffee flavour.',
    price: 799,
    comparePrice: 999,
    rating: 4.9,
    tags: ['Rechargeable', '3 Modes', 'Premium Steel'],
    href: '/shop/frother',
    reverse: false,
  },
  {
    id: 'ps-2',
    image: '/showcase/assorted.png',
    badge: 'BESTSELLER',
    title: 'Blendify Assorted Coffee Pack',
    tagline: 'All Flavours. One Box.',
    description: 'Can\'t pick a favourite? Don\'t. Our Assorted Coffee Pack includes our top 6 flavours — Mocha, Hazelnut, Vanilla, Espresso, Caramel, and Strawberry — in a premium gift-ready box. Perfect for gifting or exploration.',
    price: 2495,
    comparePrice: 2999,
    rating: 5.0,
    tags: ['6 Flavours', 'Gift Ready', 'Best Value'],
    href: '/shop/assorted',
    reverse: true,
  },
  {
    id: 'ps-3',
    image: '/showcase/hazelnut.png',
    badge: 'STAFF PICK',
    title: 'Blendify Hazelnut Coffee',
    tagline: 'Rich. Nutty. Irresistible.',
    description: '100% Pure Arabica beans, USDA-certified organic hazelnut flavouring, and zero added sugar. Our Hazelnut is the #1 selling flavour for a reason. Smooth, rich, and perfect hot or cold.',
    price: 495,
    comparePrice: 529,
    rating: 4.9,
    tags: ['100g Jar', 'Zero Sugar', 'Pure Arabica'],
    href: '/shop/hazelnut',
    reverse: false,
  },
  {
    id: 'ps-4',
    image: '/showcase/mocha.png',
    title: 'Blendify Mocha Coffee',
    tagline: 'Dark. Rich. Chocolatey.',
    description: 'For those who love their coffee with depth. Blendify Mocha blends premium Arabica instant coffee with rich cocoa notes for a drink that is bold, smooth, and indulgently dark. Your afternoon pick-me-up — perfected.',
    price: 495,
    comparePrice: 529,
    rating: 4.8,
    tags: ['100g Jar', 'Cocoa Notes', 'Bold Roast'],
    href: '/shop/mocha',
    reverse: true,
  },
];

function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <div className={styles.imageOuter} ref={ref}>
      <motion.div className={styles.imageInner} style={{ y }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="50vw"
          className={styles.showcaseImg}
        />
      </motion.div>
    </div>
  );
}

export function ProductShowcase() {
  return (
    <section className={styles.section}>
      {SHOWCASE_PRODUCTS.map((item, idx) => (
        <div
          key={item.id}
          className={`${styles.row} ${item.reverse ? styles.rowReverse : ''}`}
        >
          {/* Image side */}
          <motion.div
            className={styles.imageSide}
            initial={{ opacity: 0, x: item.reverse ? 60 : -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <ParallaxImage src={item.image} alt={item.title} />
          </motion.div>

          {/* Content side */}
          <motion.div
            className={styles.contentSide}
            initial={{ opacity: 0, x: item.reverse ? -60 : 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.content}>
              {item.badge && (
                <span className={styles.badge}>{item.badge}</span>
              )}

              <h2 className={styles.productTitle}>{item.title}</h2>
              <p className={styles.tagline}>{item.tagline}</p>

              <div className={styles.rating}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.round(item.rating) ? 'currentColor' : 'none'}
                    className={i < Math.round(item.rating) ? styles.starOn : styles.starOff}
                  />
                ))}
                <span className={styles.ratingNum}>{item.rating.toFixed(1)}</span>
              </div>

              <p className={styles.description}>{item.description}</p>

              <div className={styles.tags}>
                {item.tags.map((t) => (
                  <span key={t} className={styles.tag}>{t}</span>
                ))}
              </div>

              <div className={styles.priceRow}>
                <span className={styles.price}>₹{item.price.toLocaleString()}.00</span>
                {item.comparePrice && (
                  <span className={styles.comparePrice}>
                    <s>₹{item.comparePrice.toLocaleString()}.00</s>
                  </span>
                )}
                {item.comparePrice && (
                  <span className={styles.saving}>
                    Save ₹{(item.comparePrice - item.price).toLocaleString()}
                  </span>
                )}
              </div>

              <div className={styles.ctas}>
                <Link href={item.href} className={`btn btn--primary btn--lg ${styles.buyBtn}`}>
                  <ShoppingCart size={18} />
                  Add to Cart
                </Link>
                <Link href={item.href} className={`btn btn--outline ${styles.learnBtn}`}>
                  Learn More
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </section>
  );
}
