'use client';

/**
 * BLENDIFY — FlavourCollectionGrid
 * Premium 6-jar collection showcase.
 * Inspired by Davidoff product lineup — dark glass jars, coloured labels.
 * - Hover: scale + reveal overlay with Quick Add + Wishlist
 * - Rating stars, price, review count rendered by UI (NOT baked into images)
 * - Click entire card → product page
 * - Wishlist: integrates with wishlistStore
 * - Quick Add: integrates with cartStore
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { viewportConfig } from '@/lib/animations';
import styles from './FlavourCollectionGrid.module.css';

interface FlavourProduct {
  id: string;
  slug: string;
  name: string;
  flavour: string;
  tagline: string;
  image: string;
  price: number;
  comparePrice: number;
  rating: number;
  reviews: number;
  accentColor: string;
  labelColor: string;
}

const FLAVOURS: FlavourProduct[] = [
  {
    id: 'flv-mocha',
    slug: 'blendify-mocha',
    name: 'Blendify Mocha',
    flavour: 'Mocha',
    tagline: 'Dark. Rich. Chocolatey.',
    image: '/products/mocha.png',
    price: 495,
    comparePrice: 529,
    rating: 4.9,
    reviews: 312,
    accentColor: '#2C1008',
    labelColor: '#3D1A0C',
  },
  {
    id: 'flv-vanilla',
    slug: 'blendify-vanilla',
    name: 'Blendify Vanilla',
    flavour: 'Vanilla',
    tagline: 'Smooth. Creamy. Irresistible.',
    image: '/products/vanilla.png',
    price: 495,
    comparePrice: 549,
    rating: 4.8,
    reviews: 241,
    accentColor: '#8B6010',
    labelColor: '#A0741A',
  },
  {
    id: 'flv-hazelnut',
    slug: 'blendify-hazelnut',
    name: 'Blendify Hazelnut',
    flavour: 'Hazelnut',
    tagline: 'Nutty. Warm. Toasty.',
    image: '/products/hazelnut.png',
    price: 495,
    comparePrice: 529,
    rating: 4.9,
    reviews: 287,
    accentColor: '#5C3317',
    labelColor: '#6B3D1C',
  },
  {
    id: 'flv-espresso',
    slug: 'blendify-espresso',
    name: 'Blendify Espresso',
    flavour: 'Espresso',
    tagline: 'Bold. Intense. Unapologetic.',
    image: '/products/espresso.png',
    price: 549,
    comparePrice: 599,
    rating: 4.9,
    reviews: 204,
    accentColor: '#0D0500',
    labelColor: '#1A0A00',
  },
  {
    id: 'flv-caramel',
    slug: 'blendify-caramel',
    name: 'Blendify Caramel',
    flavour: 'Caramel',
    tagline: 'Golden. Buttery. Indulgent.',
    image: '/products/caramel.png',
    price: 479,
    comparePrice: 519,
    rating: 4.7,
    reviews: 178,
    accentColor: '#8B4513',
    labelColor: '#A05020',
  },
  {
    id: 'flv-strawberry',
    slug: 'blendify-strawberry',
    name: 'Blendify Strawberry',
    flavour: 'Strawberry',
    tagline: 'Fruity. Refreshing. Unique.',
    image: '/products/strawberry.png',
    price: 479,
    comparePrice: 529,
    rating: 4.7,
    reviews: 152,
    accentColor: '#8B1A2A',
    labelColor: '#9E2233',
  },
];

function StarRow({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          color={i <= Math.round(rating) ? '#f59e0b' : '#d1c4b0'}
        />
      ))}
      <span className={styles.ratingText}>{rating.toFixed(1)}</span>
      <span className={styles.reviewCount}>({reviews})</span>
    </div>
  );
}

function FlavourCard({ product, index }: { product: FlavourProduct; index: number }) {
  const [hovered, setHovered] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();

  const savePercent = Math.round(
    ((product.comparePrice - product.price) / product.comparePrice) * 100,
  );

  // Build a minimal compatible object for store calls
  const pseudoProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    images: [product.image],
    basePrice: product.price / 83.5,
    compareAtPrice: product.comparePrice / 83.5,
  } as Parameters<typeof addItem>[0];

  const pseudoVariant = {
    id: `${product.id}-100g`,
    productId: product.id,
    size: '100g',
    grind: 'instant' as const,
    price: product.price / 83.5,
    inventory: 50,
    sku: product.id.toUpperCase(),
  };

  const wishlisted = isWishlisted(product.id, pseudoVariant.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(pseudoProduct, pseudoVariant, 1);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(pseudoProduct, pseudoVariant);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/shop/${product.slug}`}
        className={styles.card}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Save badge */}
        <div className={styles.saveBadge}>Save {savePercent}%</div>

        {/* Wishlist button */}
        <button
          className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistActive : ''}`}
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={14} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Image area */}
        <div className={styles.imageWrap}>
          <motion.div
            className={styles.imageInner}
            animate={{ scale: hovered ? 1.06 : 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={product.image}
              alt={`${product.name} — Premium Flavoured Instant Coffee`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={styles.image}
              style={{ objectFit: 'contain', padding: '12px' }}
            />
          </motion.div>

          {/* Quick Add overlay */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                className={styles.quickAddOverlay}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <button className={styles.quickAddBtn} onClick={handleQuickAdd}>
                  <ShoppingBag size={14} />
                  Quick Add
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Info */}
        <div className={styles.info}>
          <StarRow rating={product.rating} reviews={product.reviews} />
          <h3 className={styles.name}>{product.flavour}</h3>
          <p className={styles.tagline}>{product.tagline}</p>
          <div className={styles.priceRow}>
            <span className={styles.price}>₹{product.price}</span>
            <span className={styles.comparePrice}>₹{product.comparePrice}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function FlavourCollectionGrid() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.65 }}
        >
          <span className={styles.eyebrow}>Flavour Collection</span>
          <h2 className={styles.title}>6 Premium Flavours</h2>
          <p className={styles.subtitle}>
            100% Arabica. No added sugar. No artificial additives. Just pure coffee perfection.
          </p>
          <Link href="/shop?category=explore" className={styles.viewAll}>
            View All Flavours <ArrowRight size={16} />
          </Link>
        </motion.div>

        {/* Grid */}
        <div className={styles.grid}>
          {FLAVOURS.map((product, index) => (
            <FlavourCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
