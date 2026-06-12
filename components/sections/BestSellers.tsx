'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ProductCard, type ProductCardData } from '@/components/products/ProductCard';
import { staggerContainer, slideUp, viewportConfig } from '@/lib/animations';
import styles from './BestSellers.module.css';

const BEST_SELLERS: ProductCardData[] = [
  { id: '1', name: 'Classic Hazelnut Bliss', slug: 'hazelnut-bliss', price: 349, originalPrice: 449, rating: 4.9, reviewCount: 312, badge: 'BESTSELLER', tag: 'Flavoured', emoji: '🌰', flavour: 'Hazelnut' },
  { id: '2', name: 'Cold Brew Concentrate', slug: 'cold-brew', price: 499, originalPrice: 599, rating: 4.8, reviewCount: 198, badge: 'HOT PICK', tag: 'Cold Brew', emoji: '🧊', flavour: 'Original' },
  { id: '3', name: 'Vanilla Latte Instant', slug: 'vanilla-latte', price: 299, rating: 4.7, reviewCount: 425, badge: 'NEW', tag: 'Instant', emoji: '☕', flavour: 'Vanilla' },
  { id: '4', name: 'Dark Roast Reserve', slug: 'dark-roast', price: 549, originalPrice: 699, rating: 4.9, reviewCount: 156, tag: 'Dark Roast', emoji: '🫘', flavour: 'Bold' },
  { id: '5', name: 'Caramel Macchiato Mix', slug: 'caramel-macchiato', price: 329, originalPrice: 399, rating: 4.6, reviewCount: 287, badge: 'LIMITED', tag: 'Flavoured', emoji: '🍮', flavour: 'Caramel' },
  { id: '6', name: 'Morning Ritual Blend', slug: 'morning-ritual', price: 449, rating: 4.8, reviewCount: 203, tag: 'Blend', emoji: '🌅', flavour: 'Medium Roast' },
  { id: '7', name: 'Espresso Shot Pack', slug: 'espresso-shot', price: 399, originalPrice: 499, rating: 4.9, reviewCount: 341, badge: 'BESTSELLER', tag: 'Espresso', emoji: '⚡', flavour: 'Intense' },
  { id: '8', name: 'Spiced Chai Latte', slug: 'spiced-chai', price: 279, rating: 4.7, reviewCount: 178, badge: 'NEW', tag: 'Specialty', emoji: '🌶️', flavour: 'Spiced' },
];

export function BestSellers() {
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
          <span className="section-label">Best Sellers</span>
          <h2 className={`section-title ${styles.title}`}>Fan Favourites</h2>
          <p className="section-subtitle">The coffees your mornings can't stop asking for.</p>
        </motion.div>

        <motion.div
          className={styles.grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          {BEST_SELLERS.map((product) => (
            <motion.div key={product.id} variants={slideUp}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className={styles.footer}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportConfig}
          transition={{ delay: 0.4 }}
        >
          <Link href="/shop" className="btn btn--outline btn--lg">
            View All Products <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
