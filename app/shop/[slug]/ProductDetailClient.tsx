'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, ShoppingBag, ChevronRight, ArrowLeft, CheckCircle2, MapPin } from 'lucide-react';
import type { Product, ProductVariant } from '@/types';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { formatPrice } from '@/lib/currency';
import { ProductCard } from '@/components/shop/ProductCard';
import styles from './page.module.css';

const GRIND_LABELS: Record<string, string> = {
  'whole-bean': 'Whole Bean',
  coarse: 'Coarse',
  'medium-coarse': 'Medium-Coarse',
  medium: 'Medium',
  fine: 'Fine',
  espresso: 'Espresso',
};

interface Props {
  product: Product;
  related: Product[];
}

export function ProductDetailClient({ product, related }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [selectedGrind, setSelectedGrind] = useState<string>(product.variants[0].grind);
  const [added, setAdded] = useState(false);
  const [flavorVisible, setFlavorVisible] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();
  const currency = useCurrency();
  const wishlisted = isWishlisted(product.id, selectedVariant.id);

  // Activate flavor bar animations when visible
  useEffect(() => {
    const timer = setTimeout(() => setFlavorVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Sync variant when grind changes
  const handleGrindChange = (grind: string) => {
    setSelectedGrind(grind);
    const match = product.variants.find((v) => v.grind === grind);
    if (match) setSelectedVariant(match);
  };

  // Unique grind options across all variants
  const availableGrinds = [...new Set(product.variants.map((v) => v.grind))];

  const savePercent = product.compareAtPrice && product.compareAtPrice > product.basePrice
    ? Math.round(((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100)
    : null;

  const handleAddToCart = () => {
    addItem(product, selectedVariant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  const handleWishlist = () => {
    toggleItem(product, selectedVariant);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const full = i < Math.floor(rating);
      const partial = !full && i < rating;
      return (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={full ? '#f59e0b' : partial ? 'url(#half)' : 'none'} stroke="#f59e0b" strokeWidth="2">
          {partial && (
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="transparent" />
              </linearGradient>
            </defs>
          )}
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      );
    });
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRight size={14} />
          <Link href="/shop">Shop</Link>
          <ChevronRight size={14} />
          <span>{product.name}</span>
        </nav>

        {/* Hero Section */}
        <div className={styles.hero}>
          {/* Image Panel */}
          <motion.div
            className={styles.imagePanel}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.mainImageWrapper}>
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className={styles.mainImage}
                style={{ objectFit: 'cover' }}
                priority
                sizes="(max-width: 900px) 100vw, 50vw"
              />

              {/* Badges */}
              {savePercent ? (
                <div className={`${styles.badge} ${styles.badgeSave}`}>Save {savePercent}%</div>
              ) : product.isNew ? (
                <div className={`${styles.badge} ${styles.badgeNew}`}>New</div>
              ) : product.isLimited ? (
                <div className={`${styles.badge} ${styles.badgeLimited}`}>Limited</div>
              ) : null}

              <div className={styles.brandStamp}>
                <span className={styles.brandStampText}>BLENDIFY</span>
              </div>
            </div>
          </motion.div>

          {/* Info Panel */}
          <motion.div
            className={styles.infoPanel}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Origin badge */}
            <div className={styles.originBadge}>
              <MapPin size={12} />
              {product.origin} · {product.process}
            </div>

            {/* Name & Tagline */}
            <div>
              <h1 className={styles.productName}>{product.name}</h1>
              {product.tagline && <p className={styles.tagline}>{product.tagline}</p>}
            </div>

            {/* Rating */}
            <div className={styles.ratingRow}>
              <div className={styles.stars}>{renderStars(product.rating)}</div>
              <span className={styles.ratingScore}>{product.rating.toFixed(1)}</span>
              <span className={styles.reviewCount}>({product.reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div>
              <div className={styles.priceRow}>
                <span className={styles.price}>{formatPrice(selectedVariant.price, currency)}</span>
                {selectedVariant.compareAtPrice && (
                  <span className={styles.comparePrice}>
                    {formatPrice(selectedVariant.compareAtPrice, currency)}
                  </span>
                )}
              </div>
              {product.subscriptionPrice && (
                <p className={styles.subscriptionNote}>
                  Or {formatPrice(product.subscriptionPrice, currency)}/delivery with subscription
                </p>
              )}
            </div>

            <div className={styles.divider} />

            {/* Origin metadata */}
            <div className={styles.originGrid}>
              {[
                { label: 'Region', value: product.region },
                { label: 'Altitude', value: product.altitude },
                { label: 'Process', value: product.process },
                { label: 'Roast', value: product.roastLevel.replace('-', ' ') },
              ].map(({ label, value }) => (
                <div key={label} className={styles.originItem}>
                  <span className={styles.originItemLabel}>{label}</span>
                  <span className={styles.originItemValue} style={{ textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Flavor Notes */}
            {product.flavorNotes.length > 0 && (
              <div>
                <p className={styles.variantLabel} style={{ marginBottom: '0.75rem' }}>Flavor Profile</p>
                <div className={styles.flavorNotes}>
                  {product.flavorNotes.map((note) => (
                    <div key={note.label} className={styles.flavorNote}>
                      <span className={styles.flavorLabel}>{note.label}</span>
                      <div className={styles.flavorBar}>
                        <motion.div
                          className={styles.flavorFill}
                          initial={{ width: 0 }}
                          animate={{ width: flavorVisible ? `${note.intensity}%` : 0 }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.divider} />

            {/* Size Variant Selector */}
            {product.variants.length > 1 && (
              <div className={styles.variantSection}>
                <p className={styles.variantLabel}>Size — {selectedVariant.size}</p>
                <div className={styles.variantGrid}>
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      id={`size-${v.id}`}
                      className={`${styles.variantBtn} ${selectedVariant.id === v.id ? styles.variantBtnActive : ''}`}
                      onClick={() => setSelectedVariant(v)}
                      aria-pressed={selectedVariant.id === v.id}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grind Selector */}
            {availableGrinds.length > 1 ? (
              <div className={styles.variantSection}>
                <p className={styles.variantLabel}>Grind — {GRIND_LABELS[selectedGrind] ?? selectedGrind}</p>
                <div className={styles.grindGrid}>
                  {availableGrinds.map((g) => (
                    <button
                      key={g}
                      id={`grind-${g}`}
                      className={`${styles.grindBtn} ${selectedGrind === g ? styles.grindBtnActive : ''}`}
                      onClick={() => handleGrindChange(g)}
                      aria-pressed={selectedGrind === g}
                    >
                      {GRIND_LABELS[g] ?? g}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Grind: <strong style={{ color: 'var(--text-primary)' }}>{GRIND_LABELS[selectedVariant.grind] ?? selectedVariant.grind}</strong>
              </p>
            )}

            {/* CTA */}
            <div className={styles.ctaRow}>
              <button
                id={`add-to-cart-${product.id}`}
                className={styles.addToCart}
                onClick={handleAddToCart}
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingBag size={18} />
                Add to Cart
              </button>
              <button
                id={`wishlist-${product.id}`}
                className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistBtnActive : ''}`}
                onClick={handleWishlist}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={wishlisted}
              >
                <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <AnimatePresence>
              {added && (
                <motion.div
                  className={styles.addedMessage}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  Added to cart
                </motion.div>
              )}
            </AnimatePresence>

            {/* Description */}
            {product.longDescription && (
              <div>
                <div className={styles.divider} />
                <p className={styles.description}>{product.longDescription}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Brew Guides */}
        {product.brewGuides.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
            style={{ padding: 'var(--space-8) 0' }}
          >
            <h2 className={styles.sectionHeading}>Brew Guides</h2>
            <div className={styles.brewGuides}>
              {product.brewGuides.map((guide) => (
                <div key={guide.method} className={styles.brewCard}>
                  <div className={styles.brewMeta}>
                    <p className={styles.brewMethod}>{guide.method}</p>
                    <div className={styles.brewStat}>
                      <span className={styles.brewStatLabel}>Ratio</span>
                      <span className={styles.brewStatValue}>{guide.ratio}</span>
                    </div>
                    <div className={styles.brewStat}>
                      <span className={styles.brewStatLabel}>Temp</span>
                      <span className={styles.brewStatValue}>{guide.temperature}</span>
                    </div>
                    <div className={styles.brewStat}>
                      <span className={styles.brewStatLabel}>Time</span>
                      <span className={styles.brewStatValue}>{guide.time}</span>
                    </div>
                  </div>
                  <ol className={styles.brewInstructions}>
                    {guide.instructions.map((step, i) => (
                      <li key={i} className={styles.brewStep}>
                        <span className={styles.stepNum}>{i + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <div className="container">
            <span className="section-label">You Might Also Like</span>
            <h2 className={styles.sectionHeading}>Related Coffees</h2>
            <div className={styles.relatedGrid}>
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to shop */}
      <div className="container" style={{ padding: 'var(--space-6) var(--space-4)' }}>
        <Link href="/shop" className="btn btn--outline">
          <ArrowLeft size={16} />
          Back to Shop
        </Link>
      </div>
    </div>
  );
}
