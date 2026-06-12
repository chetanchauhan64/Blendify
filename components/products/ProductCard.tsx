'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ShoppingBag, Heart, Eye } from 'lucide-react';
import { hoverLift } from '@/lib/animations';
import styles from './ProductCard.module.css';

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  tag?: string;
  emoji: string;
  flavour?: string;
}

interface Props {
  product: ProductCardData;
}

export function ProductCard({ product }: Props) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div className={styles.card} whileHover={hoverLift}>
      {/* Image area */}
      <div className={styles.imageWrap}>
        <div className={styles.imageBg}>
          <span className={styles.emoji}>{product.emoji}</span>
          {product.flavour && (
            <span className={styles.flavourHint}>{product.flavour}</span>
          )}
        </div>

        {/* Badges */}
        <div className={styles.badges}>
          {product.badge && <span className={styles.badge}>{product.badge}</span>}
          {discount > 0 && <span className={styles.badgeSale}>-{discount}%</span>}
        </div>

        {/* Hover actions */}
        <div className={styles.hoverActions}>
          <button className={styles.actionBtn} aria-label="Quick view" title="Quick View">
            <Eye size={15} />
          </button>
          <button className={styles.actionBtn} aria-label="Add to wishlist" title="Wishlist">
            <Heart size={15} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className={styles.info}>
        {product.tag && (
          <span className={styles.tag}>{product.tag}</span>
        )}
        <Link href={`/products/${product.slug}`} className={styles.name}>
          {product.name}
        </Link>

        {/* Rating */}
        <div className={styles.rating}>
          <div className={styles.stars}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < Math.round(product.rating) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <span className={styles.ratingNum}>{product.rating}</span>
          <span className={styles.reviewCount}>({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className={styles.priceRow}>
          <span className={styles.price}>₹{product.price}</span>
          {product.originalPrice && (
            <span className={styles.originalPrice}>₹{product.originalPrice}</span>
          )}
        </div>

        {/* Add to Cart */}
        <button className={styles.addToCart} aria-label={`Add ${product.name} to cart`}>
          <ShoppingBag size={14} />
          Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
