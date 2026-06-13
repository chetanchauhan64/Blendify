'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import styles from './HeroSlider.module.css';

// ── Slide Data ──────────────────────────────────────────────────
// Each slide is fully code-composed:
//   bg        = CSS gradient or solid for the slide background
//   eyebrow   = small label above headline
//   headline  = large split offer headline (array of lines)
//   accent    = highlighted word/phrase
//   sub       = supporting copy
//   cta       = button label + href
//   product   = product image path (from /images/products/)
//   productAlt= product image alt text
//   badge     = optional badge above headline (offer callout)
// ────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 1,
    bg: 'linear-gradient(118deg, #C97B3A 0%, #E8A84A 40%, #F2C46C 100%)',
    eyebrow: 'Limited Time Offer',
    headline: ['BUY ANY 3', 'COFFEES &'],
    accent: 'GET FREE',
    accentSub: 'HOT CHOCOLATE',
    sub: 'Premium Arabica. No Added Sugar. Made in India.',
    cta: { label: 'Shop Now', href: '/shop' },
    product: '/images/products/blendify-mocha.png',
    productAlt: 'BLENDIFY Mocha — Gourmet Instant Coffee',
    badge: null,
  },
  {
    id: 2,
    bg: 'linear-gradient(118deg, #7A3B1E 0%, #A8541F 40%, #C97B3A 100%)',
    eyebrow: 'New Arrival',
    headline: ['RICH CARAMEL', 'DREAM IN'],
    accent: 'EVERY SIP',
    accentSub: null,
    sub: 'Smooth. Indulgent. 100% Arabica Caramel Instant Coffee.',
    cta: { label: 'Explore Caramel', href: '/shop/blendify-caramel' },
    product: '/images/products/blendify-caramel.png',
    productAlt: 'BLENDIFY Caramel — Gourmet Instant Coffee',
    badge: 'Bestseller',
  },
  {
    id: 3,
    bg: 'linear-gradient(118deg, #2C1008 0%, #5C2A0E 45%, #8B4513 100%)',
    eyebrow: 'Dark Roast Collection',
    headline: ['THE BOLD &', 'BEAUTIFUL'],
    accent: 'ESPRESSO',
    accentSub: null,
    sub: 'Obsidian Espresso. Intense. Smooth. Unforgettable.',
    cta: { label: 'Shop Dark Roast', href: '/collections/dark-roast' },
    product: '/images/products/obsidian-espresso.png',
    productAlt: 'BLENDIFY Obsidian Espresso — Dark Roast',
    badge: 'Premium',
  },
  {
    id: 4,
    bg: 'linear-gradient(118deg, #B5621D 0%, #D4882A 40%, #E8B870 100%)',
    eyebrow: 'Flavour Collection',
    headline: ['HAZELNUT', 'BLISS IN'],
    accent: 'EVERY CUP',
    accentSub: null,
    sub: 'Warm. Nutty. Irresistible. India\'s favourite flavoured instant coffee.',
    cta: { label: 'Shop Hazelnut', href: '/shop/blendify-hazelnut' },
    product: '/images/products/blendify-hazelnut.png',
    productAlt: 'BLENDIFY Hazelnut — Gourmet Instant Coffee',
    badge: null,
  },
] as const;

const AUTOPLAY_MS = 4000;
const TRANSITION_DURATION = 0.55;

// ── Animation variants ──────────────────────────────────────────
const contentVariants = {
  enter: { opacity: 0, x: -40 },
  center: { opacity: 1, x: 0 },
  exit:  { opacity: 0, x: -24 },
};

const productVariants = {
  enter: { opacity: 0, x: 60, scale: 0.92 },
  center: { opacity: 1, x: 0, scale: 1 },
  exit:  { opacity: 0, x: 40, scale: 0.96 },
};

const transition = {
  duration: TRANSITION_DURATION,
  ease: 'easeOut',
} as const;

// ── Component ───────────────────────────────────────────────────
export function HeroSlider() {
  const [current, setCurrent]   = useState(0);
  const [mounted, setMounted]   = useState(false);
  const [paused, setPaused]     = useState(false);
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX             = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), []);
  const goTo = useCallback((i: number) => setCurrent(i), []);

  // Autoplay
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, next]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft')  prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
  };

  const slide = SLIDES[current];

  return (
    <section
      className={styles.slider}
      aria-label="Hero Banner Slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      suppressHydrationWarning
    >
      {/* ── Animated Background ──────────────────────────────── */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${slide.id}`}
          className={styles.bg}
          style={{ background: slide.bg }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: TRANSITION_DURATION }}
          aria-hidden="true"
        />
      </AnimatePresence>

      {/* ── Decorative grain overlay ─────────────────────────── */}
      <div className={styles.grain} aria-hidden="true" />

      {/* ── Slide Content ─────────────────────────────────────── */}
      <div className={styles.inner}>

        {/* Left: Offer + CTA */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${slide.id}`}
            className={styles.content}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {/* Badge */}
            {slide.badge && (
              <span className={styles.badge}>{slide.badge}</span>
            )}

            {/* Eyebrow */}
            <p className={styles.eyebrow}>{slide.eyebrow}</p>

            {/* Headline */}
            <h1 className={styles.headline}>
              {slide.headline.map((line) => (
                <span key={line} className={styles.headlineLine}>{line}</span>
              ))}
              <span className={styles.headlineAccent}>{slide.accent}</span>
              {slide.accentSub && (
                <span className={styles.headlineAccentSub}>{slide.accentSub}</span>
              )}
            </h1>

            {/* Sub copy */}
            <p className={styles.sub}>{slide.sub}</p>

            {/* CTA */}
            <Link
              href={slide.cta.href}
              className={styles.cta}
              aria-label={slide.cta.label}
            >
              {slide.cta.label}
              <ArrowRight size={18} strokeWidth={2.5} />
            </Link>

            {/* Trust pills */}
            <div className={styles.trust}>
              <span className={styles.trustPill}>🌱 100% Arabica</span>
              <span className={styles.trustPill}>🇮🇳 Made in India</span>
              <span className={styles.trustPill}>✨ No Added Sugar</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right: Product showcase */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`product-${slide.id}`}
            className={styles.productWrap}
            variants={productVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            {/* Glow behind product */}
            <div className={styles.productGlow} aria-hidden="true" />

            {/* Floating product image */}
            <motion.div
              className={styles.productImageWrap}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Image
                src={slide.product}
                alt={slide.productAlt}
                fill
                priority={slide.id === 1}
                sizes="(max-width: 768px) 80vw, 45vw"
                className={styles.productImage}
                quality={92}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Dot navigation ───────────────────────────────────── */}
      <nav className={styles.nav} aria-label="Slide navigation">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${mounted && i === current ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={mounted && i === current ? 'true' : undefined}
            suppressHydrationWarning
          >
            {i + 1}
          </button>
        ))}
      </nav>

      {/* ── Screen reader live region ─────────────────────────── */}
      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        Slide {current + 1} of {SLIDES.length}: {slide.productAlt}
      </div>
    </section>
  );
}
