'use client';

/**
 * BLENDIFY — OurCategoriesSection
 *
 * Directly replaces FlavourCollectionGrid.
 * Layout:
 *   - "OUR CATEGORIES" heading (centered, uppercase, serif, dark maroon)
 *   - Tab row: Instant Coffees | Guilt Free Iced Teas | Combo Packs | Sachets
 *   - Horizontal product rail (native scroll, no-scrollbar, circular › arrow)
 *   - Product cards (image crossfade / lazy video on hover, Quick Add, ADD TO CART)
 *   - "Shop all" pill-outline link
 *   - Green/gold toast (shared across all cards)
 *
 * Reference: https://www.impulsecoffees.com/ — "OUR CATEGORIES" section
 * Confirmed from live inspection:
 *   - Active tab: #3A0F05 bg, white text
 *   - Inactive tab: #FBF2E4 bg, #3A0F05 text
 *   - Green ribbon: permanently visible on first card (bottom of image area),
 *     text shows "Top Selling Products" by default, changes to
 *     "Highly Rated By Customers!" on card hover
 *   - Quick Add: amber gold pill (#ECA629), appears bottom-left-ish on hover,
 *     fades + slides up 14px
 *   - ADD TO CART: dark maroon full-width button
 *   - Product cards: ~300px wide, 1:1 image ratio
 *   - Video hover: products 4/6/7 in Iced Teas tab have .mp4 — lazy loaded
 *
 * Data: reuses existing EXPLORE_PRODUCTS, COMBO_PRODUCTS, SACHET_PRODUCTS
 * from lib/data/showcase-products.ts (single source of truth — no duplication).
 *
 * Instant Coffees tab: FLAVOURS array (same data as FlavourCollectionGrid used)
 * with primary=/products/X.png, hover=/images/products/blendify-X.png
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import {
  EXPLORE_PRODUCTS,
  COMBO_PRODUCTS,
  SACHET_PRODUCTS,
} from '@/lib/data/showcase-products';
import type { ShowcaseProduct } from '@/lib/data/showcase-products';
import styles from './OurCategoriesSection.module.css';

/* ─────────────────────────────────────────────────────────────────
   Auto-rotating ribbon messages — cycle every 2 s with a CSS fade
─────────────────────────────────────────────────────────────────── */
const RIBBON_MESSAGES = [
  'Top Selling Products',
  'Highly Rated by Customers!',
  'Newly Launched',
  'Free Shipping Sitewide!',
  'Best Price Guaranteed',
];

/** Returns the current message index and a CSS 'visible' flag for crossfade */
function useRibbonText(interval = 2000) {
  const [idx,     setIdx]     = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % RIBBON_MESSAGES.length);
        // Fade back in
        setVisible(true);
      }, 300);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return { text: RIBBON_MESSAGES[idx], visible };
}

/* ────────────────────────────────────────────────────────────────
   Instant Coffee product definitions
   Primary:  /products/X.png        (dark editorial jar photo)
   Hover:    /images/products/blendify-X.png  (lifestyle/detail shot)
   Slugs verified from FlavourCollectionGrid.tsx
──────────────────────────────────────────────────────────────────*/
interface InstantProduct {
  id: string;
  slug: string;
  name: string;
  flavour: string;
  image: string;       // primary
  imageHover: string;  // secondary (crossfade on hover)
  price: number;
  comparePrice: number;
  rating: number;
  reviews: number;
  ribbon?: string;     // green ribbon text (first card only)
}

const INSTANT_COFFEES: InstantProduct[] = [
  {
    id: 'cat-mocha',
    slug: 'blendify-mocha',
    name: 'Mocha Jaadu Instant Coffee',
    flavour: 'Mocha',
    image: '/products/mocha.png',
    imageHover: '/images/products/blendify-mocha.png',
    price: 495,
    comparePrice: 529,
    rating: 4.9,
    reviews: 312,
    ribbon: 'Top Selling Products',
  },
  {
    id: 'cat-vanilla',
    slug: 'blendify-vanilla',
    name: 'Vanilla Vaadaa Instant Coffee',
    flavour: 'Vanilla',
    image: '/products/vanilla.png',
    imageHover: '/images/products/blendify-vanilla.png',
    price: 495,
    comparePrice: 549,
    rating: 4.8,
    reviews: 241,
  },
  {
    id: 'cat-hazelnut',
    slug: 'blendify-hazelnut',
    name: 'Hazelnut Hungama Instant Coffee',
    flavour: 'Hazelnut',
    image: '/products/hazelnut.png',
    imageHover: '/images/products/blendify-hazelnut.png',
    price: 495,
    comparePrice: 529,
    rating: 4.9,
    reviews: 287,
  },
  {
    id: 'cat-espresso',
    slug: 'blendify-espresso',
    name: 'Espresso Jazbaa Instant Coffee',
    flavour: 'Espresso',
    image: '/products/espresso.png',
    imageHover: '/images/products/blendify-espresso.png',
    price: 549,
    comparePrice: 599,
    rating: 4.9,
    reviews: 204,
  },
  {
    id: 'cat-caramel',
    slug: 'blendify-caramel',
    name: 'Caramel Kahani Instant Coffee',
    flavour: 'Caramel',
    image: '/products/caramel.png',
    imageHover: '/images/products/blendify-caramel.png',
    price: 479,
    comparePrice: 519,
    rating: 4.7,
    reviews: 178,
  },
  {
    id: 'cat-strawberry',
    slug: 'blendify-strawberry',
    name: 'Strawberry Sapna Instant Coffee',
    flavour: 'Strawberry',
    image: '/products/strawberry.png',
    imageHover: '/images/products/blendify-strawberry.png',
    price: 479,
    comparePrice: 529,
    rating: 4.7,
    reviews: 152,
  },
];

/* ────────────────────────────────────────────────────────────────
   Video hover map for Iced Teas
   Products 4, 6, 7 have .mp4 (confirmed from filesystem scan)
   Key = ShowcaseProduct.id from EXPLORE_PRODUCTS
──────────────────────────────────────────────────────────────────*/
const ICED_TEA_VIDEOS: Record<string, string> = {
  'exp-4': '/Assets/Explore product4-details/Explore product details4.1.mp4',
  'exp-6': '/Assets/Explore product6-details/Explore product details6.1.mp4',
  'exp-7': '/Assets/Explore product7-details/Explore product details7.1.mp4',
};

/* ────────────────────────────────────────────────────────────────
   Tab definitions
──────────────────────────────────────────────────────────────────*/
type TabId = 'instant' | 'icedtea' | 'combos' | 'sachets';

const TABS: { id: TabId; label: string; badge?: string }[] = [
  { id: 'instant',  label: 'Instant Coffees' },
  { id: 'icedtea',  label: 'Guilt Free Iced Teas' },
  { id: 'combos',   label: 'Combo Packs' },
  { id: 'sachets',  label: 'Sachets' },
];

/* ────────────────────────────────────────────────────────────────
   Toast (shared via React state, rendered once at section level)
──────────────────────────────────────────────────────────────────*/
interface ToastState { visible: boolean; msg: string; }

/* ────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────*/
function savePct(price: number, comparePrice: number): number {
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function StarRating({ rating, reviews }: { rating: number; reviews?: number }) {
  return (
    <span className={styles.rating}>
      <span className={styles.ratingStar}>★</span>
      {rating.toFixed(1)}
      {reviews !== undefined && (
        <span className={styles.ratingCount}> ({reviews})</span>
      )}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────
   InstantCoffeeCard — image → image crossfade
──────────────────────────────────────────────────────────────────*/
interface InstantCardProps {
  product: InstantProduct;
  onAddToCart: (name: string) => void;
}

function InstantCoffeeCard({ product, onAddToCart }: InstantCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded]     = useState(false);
  const ribbon = useRibbonText();

  const addItem   = useCartStore((s) => s.addItem);
  const openCart  = useCartStore((s) => s.openCart);
  const { toggleItem, isWishlisted } = useWishlistStore();

  const pct = savePct(product.price, product.comparePrice);

  const pseudoProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    tagline: '',
    description: product.name,
    longDescription: '',
    origin: 'India',
    region: '',
    altitude: '',
    process: '',
    roastLevel: 'light' as const,
    flavorNotes: [],
    collections: ['instant'],
    category: 'Instant Coffee',
    format: 'jar' as const,
    images: [product.image],
    variants: [],
    basePrice: product.price / 83.5,
    compareAtPrice: product.comparePrice / 83.5,
    subscriptionPrice: product.price / 83.5,
    isNew: false,
    isBestSeller: product.ribbon !== undefined,
    isFeatured: false,
    isLimited: false,
    rating: product.rating,
    reviewCount: product.reviews,
    brewGuides: [],
    tags: [],
    createdAt: new Date(),
  };

  const pseudoVariant = {
    id: `${product.id}-100g`,
    productId: product.id,
    size: '100g',
    grind: 'instant' as const,
    price: product.price / 83.5,
    compareAtPrice: product.comparePrice / 83.5,
    inventory: 50,
    sku: product.id.toUpperCase(),
  };

  const wishlisted = isWishlisted(product.id, pseudoVariant.id);

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
    onAddToCart(`${product.flavour} Instant Coffee added to cart`);
    setTimeout(() => setAdded(false), 1500);
  }, [addItem, onAddToCart, product.flavour, pseudoProduct, pseudoVariant]);

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image area */}
      <Link href={`/shop/${product.slug}`} className={styles.mediaLink} tabIndex={-1}>
        <div className={styles.media}>
          {/* Save badge */}
          <span className={styles.saveBadge}>Save {pct}%</span>

          {/* Wishlist */}
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
            alt={product.name}
            fill
            sizes="(max-width: 640px) 68vw, 300px"
            className={`${styles.mediaImg} ${styles.mediaPrimary} ${hovered ? styles.mediaHidden : ''}`}
            style={{ objectFit: 'cover' }}
          />

          {/* Hover image (crossfade) */}
          <Image
            src={product.imageHover}
            alt={`${product.name} detail`}
            fill
            sizes="(max-width: 640px) 68vw, 300px"
            className={`${styles.mediaImg} ${styles.mediaSecondary} ${hovered ? styles.mediaVisible : ''}`}
            style={{ objectFit: 'cover' }}
          />

          {/* Green ribbon — always visible on first card (ribbon prop), auto-rotates */}
          {product.ribbon && (
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

          {/* Quick Add — fades + slides up on hover */}
          <button
            className={`${styles.quickAdd} ${hovered ? styles.quickAddVisible : ''}`}
            onClick={handleQuickAdd}
            aria-label={`Quick add ${product.name} to cart`}
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
            {product.name}
          </Link>
          <StarRating rating={product.rating} reviews={product.reviews} />
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

/* ────────────────────────────────────────────────────────────────
   ShowcaseProductCard — for Iced Teas, Combos, Sachets
   Reads from ShowcaseProduct; video hover where .mp4 exists
──────────────────────────────────────────────────────────────────*/
interface ShowcaseCardProps {
  product: ShowcaseProduct;
  videoSrc?: string;     // if set → lazy video hover
  isFirst?: boolean;     // show green ribbon
  onAddToCart: (name: string) => void;
}

function ShowcaseProductCard({ product, videoSrc, isFirst, onAddToCart }: ShowcaseCardProps) {
  const [hovered, setHovered] = useState(false);
  const [added, setAdded]     = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ribbon   = useRibbonText();

  const addItem   = useCartStore((s) => s.addItem);
  const openCart  = useCartStore((s) => s.openCart);
  const { toggleItem, isWishlisted } = useWishlistStore();

  const pct = savePct(product.price, product.comparePrice);
  const hoverImage = product.detailImages?.[0];

  // Pseudo product/variant for cart store
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

  // Lazy video: load and play on mouseenter, pause+reset on mouseleave
  const handleMouseEnter = useCallback(() => {
    setHovered(true);
    if (videoRef.current && videoSrc) {
      const vid = videoRef.current;
      // Set src lazily (preload="none" prevents any download until here)
      if (!vid.src) {
        vid.src = videoSrc;
        vid.load();
      }
      vid.play().catch(() => {/* autoplay may be blocked — silent fail */});
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
      {/* Image/media area */}
      <Link href={`/shop/${product.slug}`} className={styles.mediaLink} tabIndex={-1}>
        <div className={styles.media}>
          {/* Save / badge */}
          {product.badge && (
            <span className={`${styles.saveBadge} ${product.badgeType === 'new' ? styles.saveBadgeNew : ''}`}>
              {product.badge}
            </span>
          )}

          {/* Wishlist */}
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

          {/* Hover layer: video OR secondary image */}
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

          {/* Green ribbon — first card only, auto-rotates */}
          {isFirst && (
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

          {/* Quick Add */}
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

/* ────────────────────────────────────────────────────────────────
   OurCategoriesSection — main export
──────────────────────────────────────────────────────────────────*/
export function OurCategoriesSection() {
  const [activeTab, setActiveTab] = useState<TabId>('instant');
  const [toast, setToast]         = useState<ToastState>({ visible: false, msg: '' });
  const toastTimerRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railRef                   = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast({ visible: true, msg });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, msg: '' }), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleRailNext = useCallback(() => {
    railRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  }, []);

  return (
    <section className={styles.section} aria-labelledby="categories-heading">
      {/* Heading */}
      <h2 id="categories-heading" className={styles.heading}>
        Our Categories
      </h2>

      {/* Tab row */}
      <div className={styles.tabs} role="tablist" aria-label="Product categories">
        {TABS.map((tab) => (
          <div key={tab.id} className={styles.tabWrap}>
            <button
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </div>
        ))}
      </div>

      {/* Product rail */}
      <div className={styles.railWrap}>
        <div className={styles.rail} ref={railRef} role="tabpanel">
          {activeTab === 'instant' &&
            INSTANT_COFFEES.map((p) => (
              <InstantCoffeeCard key={p.id} product={p} onAddToCart={showToast} />
            ))}

          {activeTab === 'icedtea' &&
            EXPLORE_PRODUCTS.map((p, i) => (
              <ShowcaseProductCard
                key={p.id}
                product={p}
                videoSrc={ICED_TEA_VIDEOS[p.id]}
                isFirst={i === 0}
                onAddToCart={showToast}
              />
            ))}

          {activeTab === 'combos' &&
            COMBO_PRODUCTS.map((p, i) => (
              <ShowcaseProductCard
                key={p.id}
                product={p}
                isFirst={i === 0}
                onAddToCart={showToast}
              />
            ))}

          {activeTab === 'sachets' &&
            SACHET_PRODUCTS.map((p, i) => (
              <ShowcaseProductCard
                key={p.id}
                product={p}
                isFirst={i === 0}
                onAddToCart={showToast}
              />
            ))}
        </div>

        {/* Next arrow */}
        <button
          className={styles.railArrow}
          onClick={handleRailNext}
          aria-label="Scroll to next products"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Shop all */}
      <div className={styles.shopAllWrap}>
        <Link
          href={activeTab === 'instant' ? '/shop?category=instant' :
                activeTab === 'icedtea' ? '/shop?category=icedtea' :
                activeTab === 'combos'  ? '/shop?category=combo'   :
                '/shop?category=sachet'}
          className={styles.shopAll}
        >
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
