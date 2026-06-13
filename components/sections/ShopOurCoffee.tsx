'use client';

/**
 * BLENDIFY — ShopOurCoffee
 * Left: Large featured collection card
 * Right: Product carousel (auto-slide every 4s, hover pauses)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './ShopOurCoffee.module.css';

interface ShopProduct {
  id: string;
  image: string;
  title: string;
  rating: number;
  reviews: number;
  price: number;
  href: string;
}

const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'sp-1',
    image: '/shop/iced-tea.png',
    title: 'Assorted Guilt Free Iced Tea Pack | 5 Flavours | 100g - Pack of 5 Sachets',
    rating: 5.0,
    reviews: 128,
    price: 399,
    href: '/shop/iced-tea',
  },
  {
    id: 'sp-2',
    image: '/story/frother.png',
    title: 'Blendify Frother Pro — Rechargeable Milk Frother | 3 Foaming Modes',
    rating: 4.9,
    reviews: 94,
    price: 799,
    href: '/shop/frother',
  },
  {
    id: 'sp-3',
    image: '/showcase/hazelnut.png',
    title: 'BLENDIFY Hazelnut Instant Coffee | Rich & Nutty 100g',
    rating: 4.9,
    reviews: 210,
    price: 495,
    href: '/shop/hazelnut',
  },
  {
    id: 'sp-4',
    image: '/showcase/mocha.png',
    title: 'BLENDIFY Mocha Instant Coffee | Premium Dark Chocolate 100g',
    rating: 4.8,
    reviews: 186,
    price: 495,
    href: '/shop/mocha',
  },
  {
    id: 'sp-5',
    image: '/story/coffee-collection.png',
    title: 'BLENDIFY Gourmet Collection | 6 Flavoured Instant Coffees | 600g',
    rating: 5.0,
    reviews: 67,
    price: 2495,
    href: '/shop/collection',
  },
];

function StarRating({ value }: { value: number }) {
  return (
    <span className={styles.starRating}>
      {[1,2,3,4,5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= Math.round(value) ? styles.starFilled : styles.starEmpty}
          fill={i <= Math.round(value) ? 'currentColor' : 'none'}
        />
      ))}
      <span className={styles.ratingVal}>{value.toFixed(1)}</span>
    </span>
  );
}

export function ShopOurCoffee() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused]   = useState(false);
  const total = SHOP_PRODUCTS.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [paused, next]);

  const product = SHOP_PRODUCTS[current];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <motion.h2
          className={styles.sectionTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.6 }}
        >
          Shop Our Coffee
        </motion.h2>

        <div className={styles.layout}>
          {/* LEFT: Featured collection card */}
          <motion.div
            className={styles.featuredCard}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/shop" className={styles.featuredLink}>
              <Image
                src="/shop/featured.png"
                alt="Blendify Coffee Collection"
                fill
                sizes="50vw"
                className={styles.featuredImg}
                priority
              />
              <div className={styles.featuredOverlay}>
                <div className={styles.featuredContent}>
                  <span className={styles.featuredEyebrow}>Blendify Coffee Collection</span>
                  <h3 className={styles.featuredTitle}>The Complete Experience</h3>
                  <div className={styles.featuredTags}>
                    {['Flavoured Coffee', 'Instant Coffee', 'Gift Packs', 'Premium Packaging'].map((t) => (
                      <span key={t} className={styles.featuredTag}>{t}</span>
                    ))}
                  </div>
                  <span className={styles.featuredCTA}>Shop All →</span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* RIGHT: Product slider */}
          <motion.div
            className={styles.sliderSide}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={viewportConfig}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <Link href={product.href} className={styles.productCard}>
              <div className={styles.productImageWrap}>
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  sizes="40vw"
                  className={styles.productImg}
                />
              </div>
              <div className={styles.productInfo}>
                <StarRating value={product.rating} />
                <p className={styles.productTitle}>{product.title}</p>
                <span className={styles.productPrice}>From Rs.{product.price.toLocaleString()}.00</span>
              </div>
            </Link>

            {/* Navigation */}
            <div className={styles.sliderNav}>
              <button className={styles.sliderBtn} onClick={prev} aria-label="Previous product">
                <ChevronLeft size={18} />
              </button>
              <div className={styles.sliderDots}>
                {SHOP_PRODUCTS.map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                    onClick={() => setCurrent(i)}
                    aria-label={`Product ${i + 1}`}
                  />
                ))}
              </div>
              <button className={styles.sliderBtn} onClick={next} aria-label="Next product">
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
