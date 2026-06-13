'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Plus, Star, Eye } from 'lucide-react';
import type { Product } from '@/types';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useRegionStore } from '@/lib/store/regionStore';
import { formatPrice, CURRENCIES } from '@/lib/currency';
import { useMounted } from '@/lib/hooks/useMounted';
import styles from './ProductCard.module.css';

interface Props {
  product: Product;
  index?: number;
  onQuickView?: (product: Product) => void;
}

export function ProductCard({ product, index = 0, onQuickView }: Props) {
  const [hovered, setHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const { getCurrency } = useRegionStore();
  const mounted = useMounted();

  // Stable SSR default — prevents hydration mismatch from localStorage-persisted region
  const currency = mounted ? getCurrency() : CURRENCIES['USD'];

  const defaultVariant = product.variants[0];
  const wishlisted = mounted && isWishlisted(product.id, defaultVariant.id);

  // Save percentage badge
  const savePercent =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(
          ((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100,
        )
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, defaultVariant, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product, defaultVariant);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/shop/${product.slug}`}
        className={styles.card}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`${product.name} — ${formatPrice(product.basePrice, currency)}`}
      >
        {/* ── Image Area ──────────────────────────────────────── */}
        <div className={styles.imageWrapper}>

          {/* Product image with zoom on hover */}
          <motion.div
            className={styles.imageInner}
            animate={{ scale: hovered ? 1.05 : 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              style={{ objectFit: 'contain', padding: '8px' }}
              sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw"
              loading={index < 8 ? 'eager' : 'lazy'}
            />
          </motion.div>

          {/* Save badge — top left */}
          {savePercent && (
            <div className={styles.saveBadge}>Save {savePercent}%</div>
          )}
          {!savePercent && product.isNew && (
            <div className={styles.newBadge}>New</div>
          )}
          {!savePercent && !product.isNew && product.isLimited && (
            <div className={styles.limitedBadge}>Limited</div>
          )}

          {/* Wishlist button — top right */}
          <button
            id={`wishlist-${product.id}`}
            className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistActive : ''}`}
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wishlisted}
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick View button — reveals on hover (above Quick Add) */}
          {onQuickView && (
            <motion.div
              className={styles.quickViewWrap}
              initial={false}
              animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              aria-hidden={!hovered}
            >
              <button
                id={`quick-view-${product.id}`}
                className={styles.quickViewBtn}
                onClick={handleQuickView}
                aria-label={`Quick view ${product.name}`}
                tabIndex={hovered ? 0 : -1}
              >
                <Eye size={13} strokeWidth={2.5} />
                Quick View
              </button>
            </motion.div>
          )}

          {/* Quick Add — slides up from bottom of image on hover */}
          <motion.div
            className={styles.quickAddWrap}
            initial={false}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 14 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            aria-hidden={!hovered}
          >
            <button
              id={`quick-add-${product.id}`}
              className={styles.quickAddBtn}
              onClick={handleAddToCart}
              aria-label={`Quick add ${product.name} to cart`}
              tabIndex={hovered ? 0 : -1}
            >
              <Plus size={14} strokeWidth={2.5} />
              Quick add
            </button>
          </motion.div>
        </div>

        {/* ── Info Area ────────────────────────────────────────── */}
        <div className={styles.info}>
          {/* Name + Rating on same row — matches reference */}
          <div className={styles.nameRow}>
            <h3 className={styles.name}>{product.name}</h3>
            <div className={styles.rating}>
              <span className={styles.ratingScore}>{product.rating.toFixed(1)}</span>
              <Star size={11} fill="#E8A030" color="#E8A030" />
            </div>
          </div>

          {/* Price row */}
          <div className={styles.priceRow}>
            <span className={styles.price}>
              {formatPrice(product.basePrice, currency)}
            </span>
            {product.compareAtPrice && (
              <span className={styles.comparePrice}>
                {formatPrice(product.compareAtPrice, currency)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
