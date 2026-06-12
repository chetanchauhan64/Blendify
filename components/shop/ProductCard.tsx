'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Star } from 'lucide-react';
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
}

export function ProductCard({ product, index = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const { getCurrency } = useRegionStore();
  const mounted = useMounted();

  // Use a stable server-side default (USD) until client hydration is complete.
  // This prevents the SSR/client mismatch from localStorage-persisted region.
  const currency = mounted ? getCurrency() : CURRENCIES['USD'];

  const defaultVariant = product.variants[0];
  const wishlisted = mounted && isWishlisted(product.id, defaultVariant.id);

  // Calculate save percentage
  const savePercent =
    product.compareAtPrice && product.compareAtPrice > product.basePrice
      ? Math.round(
          ((product.compareAtPrice - product.basePrice) /
            product.compareAtPrice) *
            100,
        )
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, defaultVariant, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product, defaultVariant);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/shop/${product.slug}`}
        className={styles.card}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`${product.name} — ${formatPrice(product.basePrice, currency)}`}
      >
        {/* ── Image Area ──────────────────────────────── */}
        <div className={styles.imageWrapper}>
          {/* Product image */}
          <motion.div
            className={styles.image}
            animate={{ scale: hovered ? 1.04 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </motion.div>

          {/* Save badge — top left (matches reference) */}
          {savePercent && (
            <div className={styles.saveBadge}>Save {savePercent}%</div>
          )}
          {!savePercent && product.isNew && (
            <div className={styles.newBadge}>New</div>
          )}
          {!savePercent && product.isLimited && !product.isNew && (
            <div className={styles.limitedBadge}>Limited</div>
          )}

          {/* BLENDIFY brand watermark on image */}
          <div className={styles.brandStamp}>
            <div className={styles.brandStampInner}>
              <span className={styles.brandStampText}>BLENDIFY</span>
            </div>
          </div>

          {/* Wishlist button */}
          <button
            id={`wishlist-${product.id}`}
            className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistBtnActive : ''}`}
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wishlisted}
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Add to Cart — slides up on hover */}
          <motion.div
            className={styles.cartOverlay}
            animate={{ opacity: hovered ? 1 : 0, y: hovered ? 0 : 10 }}
            transition={{ duration: 0.22 }}
          >
            <button
              id={`add-to-cart-${product.id}`}
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingBag size={14} />
              Add to Cart
            </button>
          </motion.div>
        </div>

        {/* ── Info Area ───────────────────────────────── */}
        <div className={styles.info}>
          {/* Name — truncated to 2 lines like reference */}
          <h3 className={styles.name}>
            {product.name}
            {product.tagline ? ` | ${product.tagline}` : ''}
          </h3>

          {/* Rating row */}
          <div className={styles.ratingRow}>
            <span className={styles.ratingScore}>{product.rating.toFixed(1)}</span>
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
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
