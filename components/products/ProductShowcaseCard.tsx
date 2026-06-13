'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Heart, Eye, ShoppingCart } from 'lucide-react';
import type { ShowcaseProduct } from '@/lib/data/showcase-products';
import styles from './ProductShowcaseCard.module.css';

interface Props {
  product: ShowcaseProduct;
  dark?: boolean;   // pass true when card sits on dark/maroon bg
}

export function ProductShowcaseCard({ product, dark = false }: Props) {
  const isSeller = product.badgeType === 'seller';

  return (
    <motion.div
      className={`${styles.card} ${dark ? styles['card--dark'] : ''}`}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* ── Image ─────────────────────────────────────────────── */}
      <div className={styles.imageWrap}>
        <Image
          src={product.image}
          alt={product.title}
          width={400}
          height={400}
          quality={85}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Badges */}
        <div className={styles.badges}>
          {product.badge && (
            <span className={isSeller ? styles.badgeSeller : styles.badgeSale}>
              {product.badge}
            </span>
          )}
        </div>

        {/* "SELLER" watermark — only shown for seller-type products */}
        {isSeller && (
          <span className={styles.sellerWatermark}>SELLER</span>
        )}

        {/* Hover quick actions */}
        <div className={styles.hoverActions}>
          <button className={styles.actionBtn} aria-label="Quick view" title="Quick View">
            <Eye size={14} />
          </button>
          <button className={styles.actionBtn} aria-label="Add to wishlist" title="Wishlist">
            <Heart size={14} />
          </button>
        </div>
      </div>

      {/* ── Info ──────────────────────────────────────────────── */}
      <div className={styles.info}>
        <Link href={`/shop/${product.slug}`} className={styles.name}>
          {product.title}
        </Link>

        <div className={styles.ratingRow}>
          <span className={styles.ratingNum}>{product.rating.toFixed(1)}</span>
          <Star size={13} fill="#f4a200" color="#f4a200" className={styles.starIcon} />
        </div>

        <div className={styles.priceRow}>
          <span className={styles.price}>Rs.{product.price.toLocaleString('en-IN')}</span>
          {product.comparePrice > product.price && (
            <span className={styles.comparePrice}>
              Rs.{product.comparePrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* ── Quick Add ──────────────────────────────────────────── */}
      <Link href={`/shop/${product.slug}`} className={styles.quickAdd}>
        <ShoppingCart size={13} />
        Quick Add
      </Link>
    </motion.div>
  );
}
