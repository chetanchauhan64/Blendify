'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';
import type { Product } from '@/types';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { useCartStore } from '@/lib/store/cartStore';
import { formatPrice } from '@/lib/currency';
import styles from './ProductSpotlight.module.css';

interface Props { product: Product; }

export function ProductSpotlight({ product }: Props) {
  const currency = useCurrency();
  const addItem = useCartStore((s) => s.addItem);
  const defaultVariant = product.variants[0];

  return (
    <section className={styles.section} aria-label="Featured product">
      <div className={styles.inner}>
        {/* Left: Image */}
        <motion.div
          className={styles.imageCol}
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.imageWrapper}>
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className={styles.imageGlow} />
          </div>
          <div className={styles.imageBadge}>
            <Star size={12} fill="currentColor" />
            {product.rating} · {product.reviewCount} reviews
          </div>
        </motion.div>

        {/* Right: Content */}
        <motion.div
          className={styles.content}
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="section-label">Featured</span>
          <h2 className={styles.name}>{product.name}</h2>
          <p className={styles.tagline}>{product.tagline}</p>

          <div className={styles.meta}>
            {[
              { label: 'Origin', value: product.origin },
              { label: 'Region', value: product.region },
              { label: 'Process', value: product.process },
              { label: 'Altitude', value: product.altitude },
            ].map(({ label, value }) => (
              <div key={label} className={styles.metaItem}>
                <span className={styles.metaLabel}>{label}</span>
                <span className={styles.metaValue}>{value}</span>
              </div>
            ))}
          </div>

          <p className={styles.description}>{product.description}</p>

          {/* Flavor notes */}
          <div className={styles.flavors}>
            {product.flavorNotes.map((note) => (
              <div key={note.label} className={styles.flavorItem}>
                <div className={styles.flavorHeader}>
                  <span className={styles.flavorLabel}>{note.label}</span>
                  <span className={styles.flavorPct}>{note.intensity}%</span>
                </div>
                <div className={styles.flavorBar}>
                  <motion.div
                    className={styles.flavorFill}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${note.intensity}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(product.basePrice, currency)}</span>
            {product.compareAtPrice && (
              <span className={styles.comparePrice}>{formatPrice(product.compareAtPrice, currency)}</span>
            )}
          </div>

          <div className={styles.actions}>
            <button
              id={`spotlight-add-cart-${product.id}`}
              className="btn btn--primary btn--lg"
              onClick={() => addItem(product, defaultVariant, 1)}
            >
              Add to Cart
            </button>
            <Link href={`/shop/${product.slug}`} className="btn btn--outline btn--lg">
              View Details <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
