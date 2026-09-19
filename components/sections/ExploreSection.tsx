'use client';

/**
 * BLENDIFY — ExploreSection
 *
 * Rebuilt to use the exact same card system as OurCategoriesSection:
 *  ✅ Same 1:1 image area with crossfade/video hover
 *  ✅ Same green ribbon with auto-rotating promotional text (every 2s)
 *  ✅ Same Quick Add (amber pill, slides up on hover)
 *  ✅ Same Wishlist / heart button (top-right)
 *  ✅ Same Save badge (top-left)
 *  ✅ Same ADD TO CART button (dark maroon)
 *  ✅ Same card shadow / lift hover / spacing / typography
 *  ✅ Same toast notification
 *  ✅ Same rail arrow
 *  ✅ Shares OurCategoriesSection.module.css — zero style duplication
 *
 * All existing EXPLORE_PRODUCTS data, routes (/shop/[slug]),
 * pricing, and imagery are kept exactly as-is.
 *
 * Video hover: products exp-4, exp-6, exp-7 have .mp4 files
 * (same map used in OurCategoriesSection's Iced Teas tab).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, ChevronRight } from 'lucide-react';
import { useCartStore }     from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { EXPLORE_PRODUCTS } from '@/lib/data/showcase-products';
import type { ShowcaseProduct } from '@/lib/data/showcase-products';
// Reuse OurCategoriesSection styles — identical card design
import styles from './OurCategoriesSection.module.css';

/* ─────────────────────────────────────────────────────────────────
   Auto-rotating ribbon messages (same set as OurCategoriesSection)
   ───────────────────────────────────────────────────────────────── */
const RIBBON_MESSAGES = [
  'Top Selling Products',
  'Highly Rated by Customers!',
  'Newly Launched',
  'Free Shipping Sitewide!',
  'Best Price Guaranteed',
];

function useRibbonText(interval = 2000) {
  const [idx,     setIdx]     = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % RIBBON_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return { text: RIBBON_MESSAGES[idx], visible };
}

/* ─────────────────────────────────────────────────────────────────
   Video hover map — same as OurCategoriesSection Iced Teas tab
   ───────────────────────────────────────────────────────────────── */
const EXPLORE_VIDEOS: Record<string, string> = {
  'exp-4': '/Assets/Explore product4-details/Explore product details4.1.mp4',
  'exp-6': '/Assets/Explore product6-details/Explore product details6.1.mp4',
  'exp-7': '/Assets/Explore product7-details/Explore product details7.1.mp4',
};

/* ─────────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────────── */
function savePct(price: number, comparePrice: number) {
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className={styles.rating}>
      <span className={styles.ratingStar}>★</span>
      {rating.toFixed(1)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ExploreCard — identical behaviour to ShowcaseProductCard in
   OurCategoriesSection, plus green ribbon on every card.
   ───────────────────────────────────────────────────────────────── */
interface ExploreCardProps {
  product: ShowcaseProduct;
  videoSrc?: string;
  showRibbon?: boolean;    // show the green ribbon strip
  onAddToCart: (msg: string) => void;
}

function ExploreCard({ product, videoSrc, showRibbon, onAddToCart }: ExploreCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded]     = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ribbon   = useRibbonText();

  const addItem  = useCartStore(s => s.addItem);
  const openCart = useCartStore(s => s.openCart);
  const { toggleItem, isWishlisted } = useWishlistStore();

  const pct        = savePct(product.price, product.comparePrice);
  const hoverImage = product.detailImages?.[0];

  /* Pseudo product/variant for cart + wishlist */
  const pseudoProduct = {
    id: product.id,
    slug: product.slug,
    name: product.title,
    tagline: '',
    description: product.title,
    longDescription: '',
    origin: 'India',
    region: '',
    altitude: '',
    process: '',
    roastLevel: 'light' as const,
    flavorNotes: [],
    collections: [product.category],
    category: product.category,
    format: 'bag' as const,
    images: [product.image],
    variants: [],
    basePrice: product.price / 83.5,
    compareAtPrice: product.comparePrice / 83.5,
    subscriptionPrice: product.price / 83.5,
    isNew: product.badgeType === 'new',
    isBestSeller: product.badgeType === 'seller',
    isFeatured: false,
    isLimited: false,
    rating: product.rating,
    reviewCount: product.stock,
    brewGuides: [],
    tags: [],
    createdAt: new Date(),
  };

  const pseudoVariant = {
    id: `${product.id}-default`,
    productId: product.id,
    size: '100g',
    grind: 'instant' as const,
    price: product.price / 83.5,
    compareAtPrice: product.comparePrice / 83.5,
    inventory: product.stock,
    sku: product.id.toUpperCase(),
  };

  const wishlisted = isWishlisted(product.id, pseudoVariant.id);

  /* Lazy video hover */
  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if (videoRef.current && videoSrc) {
      const vid = videoRef.current;
      if (!vid.src) { vid.src = videoSrc; vid.load(); }
      vid.play().catch(() => {});
    }
  }, [videoSrc]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  const handleQuickAdd = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(pseudoProduct, pseudoVariant, 1);
    openCart();
  }, [addItem, openCart, pseudoProduct, pseudoVariant]);

  const handleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(pseudoProduct, pseudoVariant);
  }, [toggleItem, pseudoProduct, pseudoVariant]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(pseudoProduct, pseudoVariant, 1);
    setAdded(true);
    onAddToCart(`${product.title} added to cart`);
    setTimeout(() => setAdded(false), 1500);
  }, [addItem, onAddToCart, product.title, pseudoProduct, pseudoVariant]);

  return (
    <div
      className={styles.card}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image / media area */}
      <Link href={`/shop/${product.slug}`} className={styles.mediaLink} tabIndex={-1}>
        <div className={styles.media}>

          {/* Save / badge (top-left) */}
          {product.badge ? (
            <span className={`${styles.saveBadge} ${product.badgeType === 'new' ? styles.saveBadgeNew : ''}`}>
              {product.badge}
            </span>
          ) : (
            <span className={styles.saveBadge}>Save {pct}%</span>
          )}

          {/* Wishlist (top-right) */}
          <button
            className={`${styles.wishBtn} ${wishlisted ? styles.wishActive : ''}`}
            onClick={handleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Primary image */}
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 68vw, 300px"
            className={`${styles.mediaImg} ${styles.mediaPrimary} ${hovered ? styles.mediaHidden : ''}`}
            style={{ objectFit: 'cover' }}
          />

          {/* Hover layer: video OR detail image */}
          {videoSrc ? (
            <video
              ref={videoRef}
              className={`${styles.mediaVideo} ${hovered ? styles.mediaVisible : ''}`}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
            />
          ) : hoverImage ? (
            <Image
              src={hoverImage}
              alt={`${product.title} detail`}
              fill
              sizes="(max-width: 640px) 68vw, 300px"
              className={`${styles.mediaImg} ${styles.mediaSecondary} ${hovered ? styles.mediaVisible : ''}`}
              style={{ objectFit: 'cover' }}
            />
          ) : null}

          {/* Green ribbon with auto-rotating text */}
          {showRibbon && (
            <div className={styles.greenRibbon}>
              <span className={styles.ribbonIcon}>✦</span>
              <span
                className={styles.ribbonText}
                style={{ opacity: ribbon.visible ? 1 : 0 }}
              >
                {ribbon.text}
              </span>
            </div>
          )}

          {/* Quick Add — amber pill, slides up on hover */}
          <button
            className={`${styles.quickAdd} ${hovered ? styles.quickAddVisible : ''}`}
            onClick={handleQuickAdd}
            aria-label={`Quick add ${product.title} to cart`}
          >
            <ShoppingBag size={13} />
            + Quick add
          </button>
        </div>
      </Link>

      {/* Card body */}
      <div className={styles.cardBody}>
        <div className={styles.titleRow}>
          <Link href={`/shop/${product.slug}`} className={styles.cardTitle}>
            {product.title}
          </Link>
          <StarRating rating={product.rating} />
        </div>
        <div className={styles.priceRow}>
          <span className={styles.salePrice}>₹{product.price}</span>
          <span className={styles.comparePrice}>₹{product.comparePrice}</span>
        </div>
        <button
          className={`${styles.addToCart} ${added ? styles.addToCartAdded : ''}`}
          onClick={handleAddToCart}
        >
          {added ? 'ADDED ✓' : 'ADD TO CART'}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ExploreSection — main export
   ───────────────────────────────────────────────────────────────── */
export function ExploreSection() {
  const [toast, setToast]     = useState({ visible: false, msg: '' });
  const toastTimer            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railRef               = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast({ visible: true, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast({ visible: false, msg: '' }),
      2200,
    );
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const handleNext = useCallback(() => {
    railRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  }, []);

  return (
    <section
      className={styles.section}
      aria-labelledby="explore-heading"
      style={{ background: '#FBF2E4' }}   /* slightly lighter than Our Categories */
    >
      {/* Heading */}
      <h2 id="explore-heading" className={styles.heading}>
        Explore
      </h2>

      {/* Product rail */}
      <div className={styles.railWrap}>
        <div className={styles.rail} ref={railRef} role="list">
          {EXPLORE_PRODUCTS.map((p, i) => (
            <ExploreCard
              key={p.id}
              product={p}
              videoSrc={EXPLORE_VIDEOS[p.id]}
              showRibbon={true}           /* green ribbon on EVERY explore card */
              onAddToCart={showToast}
            />
          ))}
        </div>

        {/* Rail next arrow */}
        <button
          className={styles.railArrow}
          onClick={handleNext}
          aria-label="Scroll to next products"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Shop all */}
      <div className={styles.shopAllWrap}>
        <Link href="/shop?category=explore" className={styles.shopAll}>
          Shop all
        </Link>
      </div>

      {/* Toast */}
      <div
        className={`${styles.toast} ${toast.visible ? styles.toastVisible : ''}`}
        role="status"
        aria-live="polite"
      >
        ✓ {toast.msg}
      </div>
    </section>
  );
}
