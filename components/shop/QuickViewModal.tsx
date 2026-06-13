'use client';

/**
 * BLENDIFY — QuickViewModal
 * Animated modal for product quick view on shop page.
 * No page reload. Backdrop close. Escape key close.
 * Shows: image, title, price/discount, rating, flavour, size selector,
 *        Add to Cart, Wishlist, Compare, View Details link.
 */

import { useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Heart, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import type { Product, ProductVariant } from '@/types';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useRegionStore } from '@/lib/store/regionStore';
import { formatPrice, CURRENCIES } from '@/lib/currency';
import { useMounted } from '@/lib/hooks/useMounted';
import styles from './QuickViewModal.module.css';

interface Props {
  product: Product | null;
  onClose: () => void;
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className={styles.starRow}>
      {[1,2,3,4,5].map((i) => (
        <Star
          key={i}
          size={13}
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          color={i <= Math.round(rating) ? '#f59e0b' : '#d1c4b0'}
        />
      ))}
      <span className={styles.ratingVal}>{rating.toFixed(1)}</span>
      <span className={styles.reviewCount}>({count.toLocaleString()} reviews)</span>
    </div>
  );
}

export function QuickViewModal({ product, onClose }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const { getCurrency } = useRegionStore();
  const mounted = useMounted();
  const currency = mounted ? getCurrency() : CURRENCIES['USD'];

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0]);
      setActiveImage(0);
      setAdded(false);
    }
  }, [product]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock scroll
  useEffect(() => {
    if (product) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [product]);

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedVariant) return;
    addItem(product, selectedVariant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }, [product, selectedVariant, addItem]);

  const handleWishlist = useCallback(() => {
    if (!product || !selectedVariant) return;
    toggleItem(product, selectedVariant);
  }, [product, selectedVariant, toggleItem]);

  const wishlisted = mounted && product && selectedVariant
    ? isWishlisted(product.id, selectedVariant.id)
    : false;

  const savePercent = product?.compareAtPrice && product.compareAtPrice > product.basePrice
    ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
    : null;

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${product.name}`}
          >
            {/* Close */}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close quick view">
              <X size={18} />
            </button>

            <div className={styles.layout}>
              {/* LEFT: Image gallery */}
              <div className={styles.imagePanel}>
                <div className={styles.mainImageWrap}>
                  <Image
                    src={product.images[activeImage] ?? product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 45vw"
                    className={styles.mainImage}
                    style={{ objectFit: 'contain', padding: '16px' }}
                    priority
                  />
                  {savePercent && (
                    <div className={styles.saveBadge}>Save {savePercent}%</div>
                  )}
                  {product.isNew && !savePercent && (
                    <div className={styles.newBadge}>New</div>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className={styles.thumbRow}>
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ''}`}
                        onClick={() => setActiveImage(i)}
                        aria-label={`Image ${i + 1}`}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} view ${i + 1}`}
                          fill
                          sizes="60px"
                          style={{ objectFit: 'contain', padding: '4px' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Product info */}
              <div className={styles.infoPanel}>
                {/* Category */}
                <span className={styles.category}>{product.category}</span>

                {/* Name */}
                <h2 className={styles.productName}>{product.name}</h2>

                {/* Rating */}
                <StarRow rating={product.rating} count={product.reviewCount} />

                {/* Price */}
                <div className={styles.priceRow}>
                  <span className={styles.price}>
                    {selectedVariant ? formatPrice(selectedVariant.price, currency) : formatPrice(product.basePrice, currency)}
                  </span>
                  {product.compareAtPrice && (
                    <span className={styles.comparePrice}>
                      {formatPrice(product.compareAtPrice, currency)}
                    </span>
                  )}
                  {savePercent && (
                    <span className={styles.savePill}>Save {savePercent}%</span>
                  )}
                </div>

                {/* Tagline */}
                <p className={styles.tagline}>{product.tagline}</p>

                {/* Size variants */}
                {product.variants.length > 1 && (
                  <div className={styles.variantSection}>
                    <p className={styles.variantLabel}>
                      Size — <strong>{selectedVariant?.size}</strong>
                    </p>
                    <div className={styles.variantGrid}>
                      {product.variants.map((v) => (
                        <button
                          key={v.id}
                          id={`qv-size-${v.id}`}
                          className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.variantBtnActive : ''}`}
                          onClick={() => setSelectedVariant(v)}
                        >
                          {v.size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flavor / Description */}
                <p className={styles.description}>{product.description}</p>

                {/* Stock indicator */}
                {selectedVariant && (
                  <div className={styles.stock}>
                    <span className={`${styles.stockDot} ${selectedVariant.inventory > 10 ? styles.stockGreen : styles.stockOrange}`} />
                    <span className={styles.stockText}>
                      {selectedVariant.inventory > 10
                        ? 'In Stock'
                        : selectedVariant.inventory > 0
                          ? `Only ${selectedVariant.inventory} left`
                          : 'Out of Stock'}
                    </span>
                  </div>
                )}

                {/* CTAs */}
                <div className={styles.ctaRow}>
                  <button
                    id={`qv-add-to-cart-${product.id}`}
                    className={`${styles.addToCartBtn} ${added ? styles.addedBtn : ''}`}
                    onClick={handleAddToCart}
                    disabled={selectedVariant?.inventory === 0}
                  >
                    {added ? (
                      <><Check size={16} /> Added to Cart</>
                    ) : (
                      <><ShoppingBag size={16} /> Add to Cart</>
                    )}
                  </button>
                  <button
                    id={`qv-wishlist-${product.id}`}
                    className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistActive : ''}`}
                    onClick={handleWishlist}
                    aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* View full product details */}
                <Link href={`/shop/${product.slug}`} className={styles.viewDetailsLink} onClick={onClose}>
                  View Full Details <ArrowRight size={14} />
                </Link>

                {/* Trust badges */}
                <div className={styles.trustBadges}>
                  {['🚀 Fast Shipping', '↩️ 7-Day Returns', '🔒 Secure Payment'].map((b) => (
                    <span key={b} className={styles.trustBadge}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
