'use client';

/**
 * BLENDIFY — ComboPacks
 * Premium 3-card combo section.
 * Inspired by Lazy Bean combo pack presentation.
 * - Starter Combo (4-pack + FREE Mug)
 * - Premium Combo (6-pack + FREE Frother)
 * - Ultimate Combo (Everything + Mug + Frother)
 * Each card: hover glow, "What's Included" checklist, Add to Cart, Wishlist, bonus badge
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Check, Gift, ArrowRight, Star } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { viewportConfig } from '@/lib/animations';
import styles from './ComboPacks.module.css';

interface ComboProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  image: string;
  price: number;
  comparePrice: number;
  rating: number;
  reviews: number;
  badge: string;
  badgeIcon: string;
  bonus: string;
  bonusValue: string;
  includes: string[];
  accentColor: string;
  isBestValue?: boolean;
}

const COMBOS: ComboProduct[] = [
  {
    id: 'cmb-starter',
    slug: 'starter-combo',
    name: 'Starter Combo',
    tagline: '4 Flavour Pack',
    image: '/products/starter-combo.png',
    price: 1299,
    comparePrice: 1587,
    rating: 4.9,
    reviews: 318,
    badge: 'Free Mug',
    badgeIcon: '☕',
    bonus: 'Blendify Mug',
    bonusValue: '₹249',
    includes: ['Blendify Mocha 50g', 'Blendify Vanilla 50g', 'Blendify Hazelnut 50g', 'Blendify Espresso 50g'],
    accentColor: '#8B3A00',
  },
  {
    id: 'cmb-premium',
    slug: 'premium-combo',
    name: 'Premium Combo',
    tagline: '6 Flavour Pack',
    image: '/products/premium-combo.png',
    price: 1920,
    comparePrice: 2499,
    rating: 5.0,
    reviews: 142,
    badge: 'Free Frother',
    badgeIcon: '🌀',
    bonus: 'Blendify Frother',
    bonusValue: '₹499',
    includes: ['Blendify Mocha 50g', 'Blendify Vanilla 50g', 'Blendify Hazelnut 50g', 'Blendify Espresso 50g', 'Blendify Caramel 50g', 'Blendify Strawberry 50g'],
    accentColor: '#581312',
    isBestValue: true,
  },
  {
    id: 'cmb-ultimate',
    slug: 'ultimate-combo',
    name: 'Ultimate Combo',
    tagline: 'Everything Bundle',
    image: '/products/variety-combo.png',
    price: 4420,
    comparePrice: 5840,
    rating: 5.0,
    reviews: 87,
    badge: 'Mug + Frother',
    badgeIcon: '🎁',
    bonus: 'Mug + Frother',
    bonusValue: '₹748',
    includes: ['6× Blendify Jars (100g each)', 'All 6 Premium Flavours', 'Blendify Branded Mug', 'Blendify Frother Pro'],
    accentColor: '#2C1008',
  },
];

function ComboCard({ combo, index }: { combo: ComboProduct; index: number }) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isWishlisted } = useWishlistStore();

  const savePercent = Math.round(
    ((combo.comparePrice - combo.price) / combo.comparePrice) * 100,
  );

  const pseudoProduct = {
    id: combo.id,
    name: combo.name,
    slug: combo.slug,
    images: [combo.image],
    basePrice: combo.price / 83.5,
    compareAtPrice: combo.comparePrice / 83.5,
  } as Parameters<typeof addItem>[0];

  const pseudoVariant = {
    id: `${combo.id}-kit`,
    productId: combo.id,
    size: 'Kit',
    grind: 'instant' as const,
    price: combo.price / 83.5,
    inventory: 30,
    sku: combo.id.toUpperCase(),
  };

  const wishlisted = isWishlisted(combo.id, pseudoVariant.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(pseudoProduct, pseudoVariant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(pseudoProduct, pseudoVariant);
  };

  return (
    <motion.div
      className={`${styles.cardWrap} ${combo.isBestValue ? styles.featured : ''}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.65, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      {combo.isBestValue && (
        <div className={styles.bestValueBadge}>⭐ Best Value</div>
      )}

      <Link href={`/shop/${combo.slug}`} className={styles.card}>
        {/* Top: image + bonus badge */}
        <div className={styles.cardTop}>
          <div className={styles.imageWrap}>
            <Image
              src={combo.image}
              alt={`${combo.name} — Premium Blendify Coffee Bundle`}
              fill
              sizes="(max-width: 768px) 90vw, 30vw"
              className={styles.image}
              style={{ objectFit: 'contain', padding: '16px' }}
            />
          </div>
          {/* Bonus badge */}
          <div className={styles.bonusBadge}>
            <span className={styles.bonusIcon}>{combo.badgeIcon}</span>
            <div className={styles.bonusText}>
              <span className={styles.bonusFree}>FREE</span>
              <span className={styles.bonusName}>{combo.bonus}</span>
              <span className={styles.bonusValue}>Worth {combo.bonusValue}</span>
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className={styles.cardBody}>
          {/* Title + tagline */}
          <div className={styles.titleRow}>
            <div>
              <h3 className={styles.comboName}>{combo.name}</h3>
              <p className={styles.comboTagline}>{combo.tagline}</p>
            </div>
            <button
              className={`${styles.wishlistBtn} ${wishlisted ? styles.wishlistActive : ''}`}
              onClick={handleWishlist}
              aria-label="Toggle wishlist"
            >
              <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Rating */}
          <div className={styles.ratingRow}>
            {[1,2,3,4,5].map((i) => (
              <Star key={i} size={12} fill={i <= Math.round(combo.rating) ? '#f59e0b' : 'none'} color="#f59e0b" />
            ))}
            <span className={styles.ratingVal}>{combo.rating.toFixed(1)}</span>
            <span className={styles.reviewCount}>({combo.reviews} reviews)</span>
          </div>

          {/* What's Included */}
          <div className={styles.includesList}>
            <p className={styles.includesLabel}>
              <Gift size={12} /> What&rsquo;s Included:
            </p>
            <ul>
              {combo.includes.map((item) => (
                <li key={item} className={styles.includesItem}>
                  <Check size={12} className={styles.checkIcon} />
                  {item}
                </li>
              ))}
              <li className={styles.includesItemBonus}>
                <Check size={12} className={styles.checkIcon} />
                <strong>FREE</strong> {combo.bonus} <span>({combo.bonusValue} value)</span>
              </li>
            </ul>
          </div>

          {/* Price */}
          <div className={styles.priceRow}>
            <span className={styles.price}>₹{combo.price.toLocaleString()}</span>
            <span className={styles.comparePrice}>₹{combo.comparePrice.toLocaleString()}</span>
            <span className={styles.saveBadge}>Save {savePercent}%</span>
          </div>

          {/* CTA */}
          <div className={styles.ctaRow}>
            <button
              className={`${styles.addToCartBtn} ${added ? styles.addedBtn : ''}`}
              onClick={handleAddToCart}
            >
              <ShoppingBag size={16} />
              {added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
            <span className={styles.viewDetailsLink}>
              View Details <ArrowRight size={12} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ComboPacks() {
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
          <span className={styles.eyebrow}>Combo Offers</span>
          <h2 className={styles.title}>
            Flavoured Coffees That<br />
            <em>Match Your Every Mood</em>
          </h2>
          <p className={styles.subtitle}>
            Bundle up and save big. Every combo comes with a FREE premium gift.
          </p>
        </motion.div>

        {/* Cards */}
        <div className={styles.cards}>
          {COMBOS.map((combo, index) => (
            <ComboCard key={combo.id} combo={combo} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
