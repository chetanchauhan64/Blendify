'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore } from '@/lib/store/cartStore';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import { PRODUCTS } from '@/lib/data/products';
import styles from './page.module.css';

export function WishlistClient() {
  const { items, toggleItem } = useWishlistStore();
  const addItem = useCartStore((s) => s.addItem);
  const currency = useCurrency();

  // Resolve product + variant objects from static data (IDs stored in Zustand)
  const resolvedItems = items.flatMap((item) => {
    const product = PRODUCTS.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.id === item.variantId);
    if (!product || !variant) return [];
    return [{ product, variant }];
  });

  if (resolvedItems.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <Heart size={28} />
        </div>
        <h2>Your wishlist is empty</h2>
        <p>
          Save your favourite coffees here. Browse our collection and click the heart
          icon on any product to add it to your wishlist.
        </p>
        <Link href="/shop" className="btn btn--primary" style={{ marginTop: 'var(--space-2)' }}>
          Explore Coffee
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {resolvedItems.map(({ product, variant }, i) => {
        const savePercent =
          product.compareAtPrice && product.compareAtPrice > product.basePrice
            ? Math.round(
                ((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100,
              )
            : null;

        return (
          <motion.div
            key={`${product.id}-${variant.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Image */}
            <Link href={`/shop/${product.slug}`}>
              <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--bg-base)' }}>
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
                />
                {savePercent && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      background: 'var(--brand-primary)',
                      color: '#fff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                    }}
                  >
                    Save {savePercent}%
                  </span>
                )}
              </div>
            </Link>

            {/* Info */}
            <div style={{ padding: 'var(--space-2)' }}>
              <Link href={`/shop/${product.slug}`}>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {product.name}
                </h3>
              </Link>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                {variant.size}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'var(--space-1)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  {formatPrice(variant.price, currency)}
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    id={`cart-from-wishlist-${product.id}`}
                    onClick={() => addItem(product, variant, 1)}
                    aria-label={`Add ${product.name} to cart`}
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      background: 'var(--brand-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <ShoppingBag size={15} />
                  </button>
                  <button
                    id={`remove-wishlist-${product.id}`}
                    onClick={() => toggleItem(product, variant)}
                    aria-label="Remove from wishlist"
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-card)',
                      background: 'transparent',
                      color: 'var(--brand-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <Heart size={15} fill="currentColor" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
