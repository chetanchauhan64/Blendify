'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import styles from './BundleOffers.module.css';

interface Bundle {
  id: string; slug: string; name: string; description: string; image: string;
  originalPrice: number; bundlePrice: number; savings: number; savingsPercent: number;
}

export function BundleOffers({ bundles }: { bundles: Bundle[] }) {
  const currency = useCurrency();

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <motion.div className={styles.header} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <span className="section-label">Save More</span>
          <h2 className="section-title">Bundle Offers</h2>
          <p className="section-subtitle">Curated combinations at exceptional value. Perfect for gifting or stocking up.</p>
        </motion.div>

        <div className={styles.grid}>
          {bundles.map((bundle, i) => (
            <motion.div key={bundle.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }}>
              <Link href={`/shop?bundle=${bundle.slug}`} className={styles.card}>
                <div className={styles.imageWrapper}>
                  <Image src={bundle.image} alt={bundle.name} fill style={{ objectFit: 'cover' }} />
                  <div className={styles.overlay} />
                  <div className={styles.savingsBadge}>
                    <Tag size={14} />
                    Save {bundle.savingsPercent}%
                  </div>
                </div>
                <div className={styles.content}>
                  <h3 className={styles.name}>{bundle.name}</h3>
                  <p className={styles.desc}>{bundle.description}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>{formatPrice(bundle.bundlePrice, currency)}</span>
                    <span className={styles.original}>{formatPrice(bundle.originalPrice, currency)}</span>
                    <span className={styles.savings}>You save {formatPrice(bundle.savings, currency)}</span>
                  </div>
                  <span className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 'var(--space-2)' }}>Shop Bundle</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
