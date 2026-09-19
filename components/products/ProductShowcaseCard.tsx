'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, Eye, ShoppingCart, Leaf } from 'lucide-react';
import { useCallback, useState, useEffect } from 'react';
import type { ShowcaseProduct } from '@/lib/data/showcase-products';
import { useCartStore } from '@/lib/store/cartStore';
import styles from './ProductShowcaseCard.module.css';

interface Props {
  product: ShowcaseProduct;
  dark?: boolean;   // pass true when card sits on dark/maroon bg
}

export function ProductShowcaseCard({ product, dark = false }: Props) {
  const isNew    = product.badgeType === 'new';
  const isSeller = product.badgeType === 'seller';

  /* ── Promo strip rotation ─────────────────────────────────── */
  // Phase 0 confirmed: 2000ms interval, crossfade 300ms ease-in-out, pause on hover
  const [showHeadline, setShowHeadline] = useState(true);
  const [stripPaused, setStripPaused]   = useState(false);

  useEffect(() => {
    if (!product.promo || stripPaused) return;
    const id = setInterval(() => setShowHeadline((v) => !v), 2000);
    return () => clearInterval(id);
  }, [product.promo, stripPaused]);

  const promoText = product.promo
    ? (showHeadline ? product.promo.title : product.promo.subtitle)
    : null;

  const addItem   = useCartStore((s) => s.addItem);
  const openCart  = useCartStore((s) => s.openCart);

  /* ── Quick Add: build a lightweight Product + Variant ──────── */
  const handleQuickAdd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Construct minimal objects that satisfy the cart store types
      const fakeProduct = {
        id:              product.id,
        slug:            product.slug,
        name:            product.title,
        tagline:         '',
        description:     product.title,
        longDescription: '',
        origin:          'India',
        region:          '',
        altitude:        '',
        process:         '',
        roastLevel:      'light' as const,
        flavorNotes:     [],
        collections:     ['explore'],
        category:        'Iced Tea',
        format:          'bag' as const,
        images:          [product.image],
        variants:        [],
        basePrice:       product.price,
        compareAtPrice:  product.comparePrice,
        subscriptionPrice: product.price,
        isNew:           product.badgeType === 'new',
        isBestSeller:    false,
        isFeatured:      false,
        isLimited:       false,
        rating:          product.rating,
        reviewCount:     0,
        brewGuides:      [],
        tags:            [],
        createdAt:       new Date(),
      };

      const fakeVariant = {
        id:             `${product.id}-v1`,
        productId:      product.id,
        size:           '100g',
        grind:          'instant' as const,
        price:          product.price,
        compareAtPrice: product.comparePrice,
        inventory:      product.stock,
        sku:            product.id.toUpperCase(),
      };

      addItem(fakeProduct, fakeVariant, 1);
      openCart();
    },
    [product, addItem, openCart]
  );

  return (
    <motion.div
      className={`${styles.card} ${dark ? styles['card--dark'] : ''}`}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onHoverStart={() => setStripPaused(true)}
      onHoverEnd={() => setStripPaused(false)}
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
            <span
              className={
                isSeller
                  ? styles.badgeSeller
                  : isNew
                  ? styles.badgeNew
                  : product.badge === 'On sale'
                  ? styles.badgeOnSale
                  : styles.badgeSale
              }
            >
              {product.badge}
            </span>
          )}
        </div>

        {/* The large "SELLER" watermark text */}
        {isSeller && (
          <span className={styles.sellerWatermark}>SELLER</span>
        )}

        {/* Hover quick actions (top-right) */}
        <div className={styles.hoverActions}>
          <Link
            href={`/shop/${product.slug}`}
            className={styles.actionBtn}
            aria-label="Quick view"
            title="View product"
          >
            <Eye size={14} />
          </Link>
          <button className={styles.actionBtn} aria-label="Add to wishlist" title="Wishlist">
            <Heart size={14} />
          </button>
        </div>
      </div>

      {/* ── Green Promotional Strip ────────────────────────────── */}
      {/* Phase 0 confirmed: single line at a time, crossfade every 2000ms, 300ms ease-in-out */}
      {product.promo && promoText && (
        <div className={styles.promoStrip}>
          <div className={styles.promoIcon}>
            <Leaf size={13} />
          </div>
          <div className={styles.promoTextWrap}>
            <AnimatePresence mode="wait">
              <motion.span
                key={promoText}
                className={styles.promoText}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {promoText}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Info ──────────────────────────────────────────────── */}
      <div className={styles.info}>
        {/* Title + Rating on same row (reference layout) */}
        <div className={styles.titleRow}>
          <Link href={`/shop/${product.slug}`} className={styles.name}>
            {product.title}
          </Link>
          <div className={styles.ratingInline}>
            <span className={styles.ratingNum}>{product.rating.toFixed(1)}</span>
            <Star size={12} fill="#f4a200" color="#f4a200" />
          </div>
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
      <button className={styles.quickAdd} onClick={handleQuickAdd} aria-label="Quick add to cart">
        <ShoppingCart size={13} />
        Quick Add
      </button>
    </motion.div>
  );
}
