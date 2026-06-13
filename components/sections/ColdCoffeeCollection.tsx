'use client';

/**
 * BLENDIFY — ColdCoffeeCollection
 * Premium RTD (Ready-to-Drink) cold coffee can showcase.
 * Inspired by modern beverage brand product grids (like Sleepy Owl)
 * but 100% Blendify branded.
 *
 * Features:
 * - 6 premium can renders with floating coffee bean decorations
 * - Hover: scale + shadow + quick-shop reveal
 * - CSS animated floating beans per card
 * - All cards link to corresponding product pages
 */

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './ColdCoffeeCollection.module.css';

interface ColdCoffeeProduct {
  id: string;
  slug: string;
  name: string;
  flavour: string;
  tagline: string;
  price: number;
  comparePrice: number;
  rating: number;
  image: string;
  accentColor: string;
  beanPositions: { top: string; left: string; size: number; delay: number; rotation: number }[];
}

const COLD_COFFEE_PRODUCTS: ColdCoffeeProduct[] = [
  {
    id: 'cc-classic',
    slug: 'cold-coffee-classic',
    name: 'Blendify Classic',
    flavour: 'Classic',
    tagline: 'The Original. Bold. Pure.',
    price: 149,
    comparePrice: 179,
    rating: 4.9,
    image: '/cold-coffee/classic.png',
    accentColor: '#3B1A0A',
    beanPositions: [
      { top: '12%',  left: '8%',  size: 22, delay: 0,    rotation: -25 },
      { top: '25%',  left: '85%', size: 18, delay: 0.4,  rotation: 15 },
      { top: '65%',  left: '6%',  size: 20, delay: 0.8,  rotation: 40 },
      { top: '78%',  left: '82%', size: 16, delay: 0.2,  rotation: -10 },
      { top: '45%',  left: '90%', size: 14, delay: 1.0,  rotation: 55 },
    ],
  },
  {
    id: 'cc-mocha',
    slug: 'cold-coffee-mocha',
    name: 'Blendify Mocha',
    flavour: 'Mocha',
    tagline: 'Dark. Rich. Chocolatey.',
    price: 159,
    comparePrice: 189,
    rating: 4.8,
    image: '/cold-coffee/mocha.png',
    accentColor: '#1A0A00',
    beanPositions: [
      { top: '10%',  left: '10%', size: 20, delay: 0.3,  rotation: 30 },
      { top: '20%',  left: '80%', size: 24, delay: 0,    rotation: -20 },
      { top: '70%',  left: '8%',  size: 18, delay: 0.6,  rotation: 50 },
      { top: '80%',  left: '78%', size: 15, delay: 0.9,  rotation: -35 },
      { top: '50%',  left: '88%', size: 17, delay: 0.5,  rotation: 10 },
    ],
  },
  {
    id: 'cc-hazelnut',
    slug: 'cold-coffee-hazelnut',
    name: 'Blendify Hazelnut',
    flavour: 'Hazelnut',
    tagline: 'Nutty. Smooth. Irresistible.',
    price: 159,
    comparePrice: 189,
    rating: 4.9,
    image: '/cold-coffee/hazelnut.png',
    accentColor: '#5C3317',
    beanPositions: [
      { top: '15%',  left: '7%',  size: 19, delay: 0.1,  rotation: -40 },
      { top: '30%',  left: '83%', size: 22, delay: 0.5,  rotation: 20 },
      { top: '60%',  left: '5%',  size: 16, delay: 0.8,  rotation: 60 },
      { top: '75%',  left: '80%', size: 20, delay: 0.3,  rotation: -15 },
      { top: '48%',  left: '89%', size: 14, delay: 1.1,  rotation: 45 },
    ],
  },
  {
    id: 'cc-vanilla',
    slug: 'cold-coffee-vanilla',
    name: 'Blendify Vanilla',
    flavour: 'Vanilla',
    tagline: 'Sweet. Creamy. Divine.',
    price: 149,
    comparePrice: 179,
    rating: 4.8,
    image: '/cold-coffee/vanilla.png',
    accentColor: '#6B4226',
    beanPositions: [
      { top: '8%',   left: '9%',  size: 21, delay: 0.7,  rotation: 25 },
      { top: '22%',  left: '82%', size: 17, delay: 0.2,  rotation: -30 },
      { top: '68%',  left: '7%',  size: 23, delay: 0.4,  rotation: 55 },
      { top: '82%',  left: '79%', size: 16, delay: 0.9,  rotation: -5 },
      { top: '42%',  left: '91%', size: 13, delay: 0.6,  rotation: 70 },
    ],
  },
  {
    id: 'cc-caramel',
    slug: 'cold-coffee-caramel',
    name: 'Blendify Caramel',
    flavour: 'Caramel',
    tagline: 'Buttery. Golden. Indulgent.',
    price: 159,
    comparePrice: 189,
    rating: 4.7,
    image: '/cold-coffee/caramel.png',
    accentColor: '#8B4513',
    beanPositions: [
      { top: '11%',  left: '6%',  size: 20, delay: 0,    rotation: -20 },
      { top: '28%',  left: '84%', size: 19, delay: 0.6,  rotation: 35 },
      { top: '62%',  left: '8%',  size: 17, delay: 0.9,  rotation: -50 },
      { top: '76%',  left: '81%', size: 22, delay: 0.3,  rotation: 10 },
      { top: '45%',  left: '87%', size: 15, delay: 1.2,  rotation: 65 },
    ],
  },
  {
    id: 'cc-strawberry',
    slug: 'cold-coffee-strawberry',
    name: 'Blendify Strawberry',
    flavour: 'Strawberry',
    tagline: 'Fruity. Refreshing. Unique.',
    price: 149,
    comparePrice: 179,
    rating: 4.7,
    image: '/cold-coffee/strawberry.png',
    accentColor: '#8B1A2A',
    beanPositions: [
      { top: '13%',  left: '8%',  size: 18, delay: 0.4,  rotation: 45 },
      { top: '24%',  left: '83%', size: 21, delay: 0,    rotation: -25 },
      { top: '66%',  left: '6%',  size: 19, delay: 0.7,  rotation: 30 },
      { top: '79%',  left: '80%', size: 16, delay: 1.0,  rotation: -55 },
      { top: '50%',  left: '89%', size: 14, delay: 0.5,  rotation: 80 },
    ],
  },
];

function ColdCoffeeCard({ product, index }: { product: ColdCoffeeProduct; index: number }) {
  return (
    <motion.div
      className={styles.cardWrapper}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/shop/${product.slug}`} className={styles.card}>
        {/* Floating coffee beans */}
        <div className={styles.beansLayer} aria-hidden="true">
          {product.beanPositions.map((bean, i) => (
            <span
              key={i}
              className={styles.floatingBean}
              style={{
                top: bean.top,
                left: bean.left,
                width: `${bean.size}px`,
                height: `${bean.size * 0.65}px`,
                animationDelay: `${bean.delay}s`,
                transform: `rotate(${bean.rotation}deg)`,
              }}
            />
          ))}
        </div>

        {/* Can image */}
        <div className={styles.canWrap}>
          <Image
            src={product.image}
            alt={`${product.name} Cold Coffee Can`}
            fill
            sizes="(max-width: 768px) 45vw, 30vw"
            className={styles.canImg}
          />
        </div>

        {/* Card info */}
        <div className={styles.cardInfo}>
          <div className={styles.ratingRow}>
            <Star size={12} fill="#f4a200" color="#f4a200" />
            <span className={styles.rating}>{product.rating.toFixed(1)}</span>
          </div>
          <h3 className={styles.productName}>{product.name}</h3>
          <p className={styles.tagline}>{product.tagline}</p>
          <div className={styles.priceRow}>
            <span className={styles.price}>₹{product.price}</span>
            <span className={styles.comparePrice}>₹{product.comparePrice}</span>
            <span className={styles.savings}>
              Save ₹{product.comparePrice - product.price}
            </span>
          </div>
        </div>

        {/* Quick add — reveals on hover */}
        <div className={styles.quickAdd}>
          <ShoppingCart size={14} />
          <span>Quick Add</span>
        </div>
      </Link>
    </motion.div>
  );
}

export function ColdCoffeeCollection() {
  return (
    <section className={styles.section}>
      {/* Background decorative elements */}
      <div className={styles.bgDecor} aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <span key={i} className={styles.bgBean} style={{ animationDelay: `${i * 0.7}s` }} />
        ))}
      </div>

      <div className={styles.inner}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={styles.eyebrow}>New Collection</span>
          <h2 className={styles.title}>Blendify Cold Coffee</h2>
          <p className={styles.subtitle}>
            Premium ready-to-drink cold coffees. 100% Arabica. No preservatives. Chilled perfection.
          </p>
          <Link href="/shop?category=cold-coffee" className={styles.headerCTA}>
            Shop All Cold Coffee →
          </Link>
        </motion.div>

        {/* Products grid */}
        <div className={styles.grid}>
          {COLD_COFFEE_PRODUCTS.map((product, index) => (
            <ColdCoffeeCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
