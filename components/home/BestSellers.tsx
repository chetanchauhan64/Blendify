'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Product } from '@/types';
import { ProductCard } from '@/components/shop/ProductCard';
import styles from './BestSellers.module.css';

interface Props { products: Product[]; }

export function BestSellers({ products }: Props) {
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
          <div>
            <span className="section-label">Most Loved</span>
            <h2 className="section-title">Best Sellers</h2>
            <p className="section-subtitle">The coffees our customers reach for again and again.</p>
          </div>
          <Link href="/shop" className="btn btn--outline">
            View All <ArrowRight size={16} />
          </Link>
        </motion.div>

        <div className={styles.grid}>
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
