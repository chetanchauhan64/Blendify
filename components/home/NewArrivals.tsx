'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Product } from '@/types';
import { ProductCard } from '@/components/shop/ProductCard';
import styles from './NewArrivals.module.css';

interface Props { products: Product[]; }

export function NewArrivals({ products }: Props) {
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
          <div className={styles.labelRow}>
            <Sparkles size={16} className={styles.sparkle} />
            <span className="section-label">Just Arrived</span>
          </div>
          <h2 className="section-title">New Arrivals</h2>
          <p className="section-subtitle">
            Fresh from the roaster. Our latest additions to the collection.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <motion.div
          className={styles.cta}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/shop?filter=new" className="btn btn--outline">
            See All New Arrivals <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
