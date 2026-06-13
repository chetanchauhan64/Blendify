'use client';

/**
 * BLENDIFY — Blendify Community (Hustlers Carousel)
 * Instagram Reels / TikTok-style creator showcase
 * Auto-scroll, drag, touch swipe, infinite loop
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Share2, ShoppingCart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './BlendifyCommunity.module.css';

interface CommunityCard {
  id: string;
  image: string;
  creatorName: string;
  creatorAvatar: string;
  productName: string;
  price: number;
  comparePrice: number;
  discount: number;
  views: string;
  isVideo?: boolean;
  productHref: string;
}

const COMMUNITY_CARDS: CommunityCard[] = [
  {
    id: 'cc-1',
    image: '/community/card1.png',
    creatorName: 'blendifycoffee',
    creatorAvatar: '/community/card1.png',
    productName: 'Raat ki Rani Espresso Instant...',
    price: 489,
    comparePrice: 529,
    discount: 8,
    views: '100 Views',
    productHref: '/shop/espresso',
  },
  {
    id: 'cc-2',
    image: '/community/card2.png',
    creatorName: 'coffeelovers.in',
    creatorAvatar: '/community/card2.png',
    productName: 'Nawabi Pistachio Instant...',
    price: 499,
    comparePrice: 529,
    discount: 6,
    views: '68 Views',
    productHref: '/shop/pistachio',
  },
  {
    id: 'cc-3',
    image: '/community/card3.png',
    creatorName: 'cafeathome',
    creatorAvatar: '/community/card3.png',
    productName: 'Vichaar Over Vanilla Flavored...',
    price: 495,
    comparePrice: 529,
    discount: 6,
    views: '281 Views',
    productHref: '/shop/vanilla',
  },
  {
    id: 'cc-4',
    image: '/community/card4.png',
    creatorName: 'morningbrews',
    creatorAvatar: '/community/card4.png',
    productName: 'Blendify Coffees PACK OF 30...',
    price: 479,
    comparePrice: 599,
    discount: 20,
    views: '97 Views',
    productHref: '/shop/assorted-pack',
  },
  {
    id: 'cc-5',
    image: '/community/card5.png',
    creatorName: 'procaffeinating',
    creatorAvatar: '/community/card5.png',
    productName: 'Mocha pe Chauka Instant...',
    price: 845,
    comparePrice: 899,
    discount: 5,
    views: '50 Views',
    productHref: '/shop/mocha',
  },
  {
    id: 'cc-6',
    image: '/community/card1.png',
    creatorName: 'brewnation',
    creatorAvatar: '/community/card1.png',
    productName: 'Blendify Hazelnut Assorted...',
    price: 399,
    comparePrice: 449,
    discount: 11,
    views: '7 Views',
    productHref: '/shop/hazelnut',
  },
];

export function BlendifyCommunity() {
  const trackRef        = useRef<HTMLDivElement>(null);
  const containerRef    = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown]         = useState(false);
  const [startX, setStartX]         = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [liked, setLiked]           = useState<Record<string, boolean>>({});
  const autoScrollRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Auto-scroll ─────────────────────────────────────────── */
  const startAutoScroll = useCallback(() => {
    autoScrollRef.current = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 220, behavior: 'smooth' });
      }
    }, 3000);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
  }, []);

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [startAutoScroll, stopAutoScroll]);

  /* ── Manual scroll arrows ─────────────────────────────────── */
  const scrollPrev = () => {
    stopAutoScroll();
    trackRef.current?.scrollBy({ left: -660, behavior: 'smooth' });
    setTimeout(startAutoScroll, 3000);
  };

  const scrollNext = () => {
    stopAutoScroll();
    trackRef.current?.scrollBy({ left: 660, behavior: 'smooth' });
    setTimeout(startAutoScroll, 3000);
  };

  /* ── Mouse drag ───────────────────────────────────────────── */
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDown(true);
    setStartX(e.pageX - (trackRef.current?.offsetLeft ?? 0));
    setScrollLeft(trackRef.current?.scrollLeft ?? 0);
    stopAutoScroll();
  };
  const onMouseLeave = () => { setIsDown(false); startAutoScroll(); };
  const onMouseUp    = () => { setIsDown(false); startAutoScroll(); };
  const onMouseMove  = (e: React.MouseEvent) => {
    if (!isDown || !trackRef.current) return;
    e.preventDefault();
    const x    = e.pageX - (trackRef.current.offsetLeft ?? 0);
    const walk = (x - startX) * 1.5;
    trackRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className={styles.title}>Blendify Community</h2>
          <p className={styles.subtitle}>Real people. Real coffee moments.</p>
        </motion.div>

        {/* Carousel wrapper */}
        <div className={styles.carouselWrapper} ref={containerRef}>
          {/* Prev */}
          <button className={`${styles.navBtn} ${styles.navBtnPrev}`} onClick={scrollPrev} aria-label="Previous">
            <ChevronLeft size={20} />
          </button>

          {/* Track */}
          <div
            className={`${styles.track} ${isDown ? styles.trackDragging : ''}`}
            ref={trackRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
          >
            {[...COMMUNITY_CARDS, ...COMMUNITY_CARDS].map((card, idx) => (
              <motion.div
                key={`${card.id}-${idx}`}
                className={styles.card}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (idx % COMMUNITY_CARDS.length) * 0.08 }}
              >
                {/* Reel image */}
                <div className={styles.reelWrap}>
                  {/* Discount badge */}
                  <div className={styles.discountBadge}>{card.discount}% off</div>

                  {/* Image */}
                  <Image
                    src={card.image}
                    alt={card.productName}
                    fill
                    className={styles.reelImg}
                    sizes="200px"
                    draggable={false}
                  />

                  {/* Overlay bottom */}
                  <div className={styles.reelOverlay}>
                    <span className={styles.viewCount}><Eye size={10} /> {card.views}</span>
                    <div className={styles.reelActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setLiked(p => ({ ...p, [card.id + idx]: !p[card.id + idx] }))}
                        aria-label="Like"
                      >
                        <Heart size={16} fill={liked[card.id + idx] ? 'currentColor' : 'none'} />
                      </button>
                      <button className={styles.actionBtn} aria-label="Share">
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className={styles.cardBody}>
                  {/* Creator row */}
                  <div className={styles.creatorRow}>
                    <div className={styles.avatar}>
                      <Image src={card.creatorAvatar} alt={card.creatorName} width={28} height={28} />
                    </div>
                    <span className={styles.creatorName}>{card.creatorName}</span>
                  </div>

                  <p className={styles.productName}>{card.productName}</p>

                  <div className={styles.priceRow}>
                    <span className={styles.price}>₹{card.price.toLocaleString()}.00</span>
                    <span className={styles.comparePrice}>
                      <s>₹{card.comparePrice.toLocaleString()}.00</s>
                    </span>
                  </div>

                  <div className={styles.discountLabel}>{card.discount}% Off</div>

                  <button className={styles.buyBtn}>
                    <ShoppingCart size={13} />
                    Buy Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Next */}
          <button className={`${styles.navBtn} ${styles.navBtnNext}`} onClick={scrollNext} aria-label="Next">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
