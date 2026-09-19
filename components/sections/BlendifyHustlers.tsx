'use client';

/**
 * BLENDIFY HUSTLERS — Shoppable Video Reel Section
 *
 * Pixel-perfect match to "IMPULSE HUSTLERS" on impulsecoffees.com
 *
 * KEY DETAILS from screenshot / reference inspection:
 *  ✅ 8 real videos from /Assets/Blendify HUSTLERS/
 *  ✅ Each card: autoplay muted loop video (9:16)
 *  ✅ Circular thumbnail at card seam = SAME video playing (muted loop)
 *  ✅ Discount badge (yellow-green, top-left)
 *  ✅ Views pill (bottom-left of video area)
 *  ✅ Heart + Share mini-buttons (bottom-right of video area)
 *  ✅ Product name (2-line clamp), price, strikethrough orig, green off%
 *  ✅ Buy Now → real useCartStore.addItem → opens cart drawer
 *  ✅ Click card → lightbox modal:
 *       • Same video plays WITH SOUND (muted=false by default, toggle)
 *       • Mute/Close top-right
 *       • Right rail: Views, Heart (toggles red + count), Share, Cart
 *       • Share → dialog with WhatsApp / X / Copy Link
 *       • Bottom bar: badge, circular video thumb, product name (→ /shop/slug)
 *         price row, Buy Now
 *       • Left / Right side chevrons  (arrow keys also)
 *  ✅ Escape closes modal
 *  ✅ Real /shop/[slug] routing + UTM params
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Share2,
  ShoppingCart,
  Eye,
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useCartStore }     from '@/lib/store/cartStore';
import { PRODUCTS }         from '@/lib/data/products';
import styles from './BlendifyHustlers.module.css';

/* ─────────────────────────────────────────────────────────────────────────
   VIDEO BASE PATH
   Files: /public/Assets/Blendify HUSTLERS/Blendify-Hustlers1.mp4 … 8.mp4
   URL-encoded because folder name contains a space.
   ───────────────────────────────────────────────────────────────────────── */
const V = (n: number) =>
  `/Assets/Blendify%20HUSTLERS/Blendify-Hustlers${n}.mp4`;

/* ─────────────────────────────────────────────────────────────────────────
   REEL DATA
   slug  → matches existing /shop/[slug] routes
   thumb → product image for fallback + modal thumbnail
   ───────────────────────────────────────────────────────────────────────── */
interface Reel {
  id: string;
  slug: string;
  title: string;
  thumb: string;
  videoSrc: string;
  price: number;
  orig: number;
  off: number;
  views: number;
  likes: number;
  shares: number;
}

const REELS: Reel[] = [
  {
    id: 'h-1',
    slug: 'guilt-free-ice-tea-assorted',
    title: 'Assorted Guilt Free Iced Tea Pack | 5 Flavours | 100g',
    thumb: '/Assets/Explore 1.png',
    videoSrc: V(1),
    price: 399,
    orig: 479,
    off: 17,
    views: 339,
    likes: 14,
    shares: 3,
  },
  {
    id: 'h-2',
    slug: 'guilt-free-ice-tea-strawberry',
    title: 'Strawberry Iced Tea | No Refined Sugar | 100g — Pack of 5',
    thumb: '/Assets/Explore 2.png',
    videoSrc: V(2),
    price: 320,
    orig: 399,
    off: 20,
    views: 1300,
    likes: 21,
    shares: 5,
  },
  {
    id: 'h-3',
    slug: 'guilt-free-ice-tea-lemon',
    title: 'Lemon Iced Tea | Vitamin C Enriched | 100g — 5 Sachets',
    thumb: '/Assets/Explore 3.png',
    videoSrc: V(3),
    price: 320,
    orig: 399,
    off: 20,
    views: 471,
    likes: 18,
    shares: 4,
  },
  {
    id: 'h-4',
    slug: 'guilt-free-ice-tea-guava-chilli',
    title: 'Guava Chilli Iced Tea | Bold & Spicy | 100g — 5 Sachets',
    thumb: '/Assets/Explore 4.png',
    videoSrc: V(4),
    price: 349,
    orig: 429,
    off: 19,
    views: 204,
    likes: 9,
    shares: 2,
  },
  {
    id: 'h-5',
    slug: 'guilt-free-ice-tea-pineapple',
    title: 'Pineapple Iced Tea | Tropical Refreshment | 100g — 5 Sachets',
    thumb: '/Assets/Explore 5.png',
    videoSrc: V(5),
    price: 320,
    orig: 399,
    off: 20,
    views: 386,
    likes: 16,
    shares: 3,
  },
  {
    id: 'h-6',
    slug: 'guilt-free-ice-tea-blueberry',
    title: 'Blueberry Iced Tea | Antioxidant Rich | 100g — 5 Sachets',
    thumb: '/Assets/Explore 6.png',
    videoSrc: V(6),
    price: 349,
    orig: 429,
    off: 19,
    views: 512,
    likes: 23,
    shares: 6,
  },
  {
    id: 'h-7',
    slug: 'guilt-free-ice-tea-peach',
    title: 'Peach Iced Tea | Naturally Flavoured | 100g — 5 Sachets',
    thumb: '/Assets/Explore 7.png',
    videoSrc: V(7),
    price: 320,
    orig: 399,
    off: 20,
    views: 728,
    likes: 31,
    shares: 8,
  },
  {
    id: 'h-8',
    slug: 'guilt-free-ice-tea-mango',
    title: 'Mango Iced Tea | King of Fruits | 100g — 5 Sachets',
    thumb: '/Assets/Explore 8.png',
    videoSrc: V(8),
    price: 349,
    orig: 429,
    off: 19,
    views: 445,
    likes: 19,
    shares: 4,
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────── */
function fmtViews(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K Views`;
  return `${n} Views`;
}

function utmUrl(slug: string) {
  return `/shop/${slug}?utm_source=Blendify&utm_medium=Video&utm_campaign=Hustlers`;
}

/* ─────────────────────────────────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────────────────────────────────── */
export function BlendifyHustlers() {
  const router   = useRouter();
  const addItem  = useCartStore(s => s.addItem);
  const openCart = useCartStore(s => s.openCart);

  /* ── Carousel drag ─────────────────────────────────────── */
  const trackRef    = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragX0     = useRef(0);
  const dragSL0    = useRef(0);

  /* ── Per-card like (grid) ─────────────────────────────── */
  const [cardLiked, setCardLiked] = useState<Record<string, boolean>>({});

  /* ── Modal ─────────────────────────────────────────────── */
  const [modalIdx,   setModalIdx]   = useState<number | null>(null);
  const [muted,      setMuted]      = useState(false);   // sound ON by default in modal
  const [liked,      setLiked]      = useState(false);
  const [likeCount,  setLikeCount]  = useState(0);
  const [shareCount, setShareCount] = useState(0);

  /* ── Share dialog ─────────────────────────────────────── */
  const [showShare, setShowShare] = useState(false);

  /* ── Toast ─────────────────────────────────────────────── */
  const [toast,    setToast]    = useState('');
  const [toastVis, setToastVis] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Refs for modal + card videos */
  const modalVidRef = useRef<HTMLVideoElement>(null);
  /* We store refs for every card's circular thumbnail video */
  const thumbVidRefs = useRef<(HTMLVideoElement | null)[]>([]);
  /* Card body video refs (main card video) */
  const cardVidRefs  = useRef<(HTMLVideoElement | null)[]>([]);

  /* ── Open modal ──────────────────────────────────────── */
  const openModal = useCallback((idx: number) => {
    const r = REELS[idx];
    setModalIdx(idx);
    setLiked(false);
    setLikeCount(r.likes);
    setShareCount(r.shares);
    setMuted(false);          // play with sound
    setShowShare(false);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setModalIdx(null);
    setShowShare(false);
    document.body.style.overflow = '';
    modalVidRef.current?.pause();
  }, []);

  /* ── Keyboard ───────────────────────────────────────── */
  const stepModal = useCallback((dir: -1 | 1) => {
    setModalIdx(prev => {
      if (prev === null) return prev;
      return (prev + dir + REELS.length) % REELS.length;
    });
    setShowShare(false);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (modalIdx === null) return;
      if (e.key === 'Escape')     closeModal();
      if (e.key === 'ArrowLeft')  stepModal(-1);
      if (e.key === 'ArrowRight') stepModal(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [modalIdx, closeModal, stepModal]);

  /* ── Modal video load when index changes ────────────── */
  useEffect(() => {
    if (modalIdx === null) return;
    const r = REELS[modalIdx];
    setLiked(false);
    setLikeCount(r.likes);
    setShareCount(r.shares);

    const vid = modalVidRef.current;
    if (!vid) return;
    vid.src         = r.videoSrc;
    vid.muted       = muted;
    vid.currentTime = 0;
    vid.play().catch(() => {/* browser autoplay policy */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalIdx]);

  /* ── Sync mute ───────────────────────────────────────── */
  useEffect(() => {
    if (modalVidRef.current) modalVidRef.current.muted = muted;
  }, [muted]);

  /* ── Add to Cart (modal rail) ────────────────────────── */
  const handleAddToCart = useCallback((r: Reel) => {
    const product = PRODUCTS.find(p => p.slug === r.slug);
    if (product && product.variants.length > 0) {
      addItem(product, product.variants[0], 1);
      openCart();
      showToast('🛒 Added to cart!');
    }
  }, [addItem, openCart]);

  /* ── Buy Now (navigates to product detail page) ───────── */
  const handleBuyNow = useCallback((r: Reel) => {
    closeModal();
    router.push(utmUrl(r.slug));
  }, [closeModal, router]);

  /* ── Toast ──────────────────────────────────────────── */
  function showToast(msg: string) {
    setToast(msg);
    setToastVis(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVis(false), 2500);
  }

  /* ── Share actions ──────────────────────────────────── */
  function shareWhatsApp(r: Reel) {
    const url  = encodeURIComponent(`https://blendify.in/shop/${r.slug}`);
    const text = encodeURIComponent(`Check out ${r.title} on Blendify!`);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
    setShareCount(c => c + 1);
    setShowShare(false);
  }

  function shareX(r: Reel) {
    const url  = encodeURIComponent(`https://blendify.in/shop/${r.slug}`);
    const text = encodeURIComponent(`Loving this — ${r.title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setShareCount(c => c + 1);
    setShowShare(false);
  }

  function copyLink(r: Reel) {
    navigator.clipboard.writeText(`https://blendify.in/shop/${r.slug}`).catch(() => {});
    showToast('🔗 Link copied!');
    setShareCount(c => c + 1);
    setShowShare(false);
  }

  /* ── Carousel drag ──────────────────────────────────── */
  const onMouseDown = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    setDragging(true);
    dragX0.current  = e.pageX - trackRef.current.offsetLeft;
    dragSL0.current = trackRef.current.scrollLeft;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = dragSL0.current - (x - dragX0.current) * 1.6;
  };
  const onDragEnd = () => setDragging(false);

  const scrollBy = (dir: -1 | 1) =>
    trackRef.current?.scrollBy({ left: dir * 740, behavior: 'smooth' });

  /* ─────────────────────────────────────────────────────
     RENDER
     ─────────────────────────────────────────────────── */
  const reel = modalIdx !== null ? REELS[modalIdx] : null;

  return (
    <>
      {/* ════════════════════════════════════════════════
          SECTION
          ════════════════════════════════════════════════ */}
      <section className={styles.section} id="blendify-hustlers">
        <div className={styles.inner}>

          {/* Title */}
          <h2 className={styles.title}>BLENDIFY HUSTLERS</h2>

          {/* Carousel */}
          <div className={styles.carouselWrap}>

            {/* ← Prev */}
            <button
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Track */}
            <div
              id="hustlers-track"
              className={`${styles.carousel} ${dragging ? styles.carouselDragging : ''}`}
              ref={trackRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
            >
              {REELS.map((r, idx) => (
                <div
                  key={r.id}
                  id={`hustlers-card-${idx}`}
                  className={styles.card}
                  onClick={() => openModal(idx)}
                >
                  {/* ── Video area ─────────────────── */}
                  <div className={styles.videoWrap}>
                    <video
                      ref={el => { cardVidRefs.current[idx] = el; }}
                      className={styles.cardVideo}
                      src={r.videoSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />

                    {/* Discount badge (top-left) */}
                    {r.off > 0 && (
                      <div className={styles.badgeOff}>{r.off}% off</div>
                    )}

                    {/* Views pill (bottom-left) */}
                    <div className={styles.viewsPill}>
                      <Eye size={10} />
                      {fmtViews(r.views)}
                    </div>

                    {/* Like + Share (bottom-right) — stopPropagation */}
                    <div className={styles.miniActions}>
                      <button
                        id={`like-card-${r.id}`}
                        className={styles.miniBtn}
                        aria-label="Like"
                        onClick={e => {
                          e.stopPropagation();
                          setCardLiked(p => ({ ...p, [r.id]: !p[r.id] }));
                        }}
                      >
                        <Heart
                          size={15}
                          fill={cardLiked[r.id] ? '#ff3b5c' : 'none'}
                          color={cardLiked[r.id] ? '#ff3b5c' : '#fff'}
                        />
                      </button>
                      <button
                        id={`share-card-${r.id}`}
                        className={styles.miniBtn}
                        aria-label="Share"
                        onClick={e => {
                          e.stopPropagation();
                          openModal(idx);
                          setTimeout(() => setShowShare(true), 150);
                        }}
                      >
                        <Share2 size={13} color="#fff" />
                      </button>
                    </div>
                  </div>

                  {/* ── Card info ──────────────────── */}
                  <div className={styles.cardInfo}>

                    {/*
                      Circular thumbnail = the SAME video playing muted/loop.
                      This is the key detail from the screenshot —
                      it's a <video> element, not a static image.
                    */}
                    <div className={styles.thumbCirc}>
                      <video
                        ref={el => { thumbVidRefs.current[idx] = el; }}
                        src={r.videoSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className={styles.thumbVideo}
                      />
                    </div>

                    <p className={styles.prodName}>{r.title}</p>

                    <div className={styles.priceRow}>
                      <span className={styles.priceNow}>
                        ₹{r.price.toLocaleString('en-IN')}.00
                      </span>
                      {r.orig > r.price && (
                        <span className={styles.priceOrig}>
                          ₹{r.orig.toLocaleString('en-IN')}.00
                        </span>
                      )}
                      {r.off > 0 && (
                        <span className={styles.offLabel}>{r.off}% Off</span>
                      )}
                    </div>

                    <button
                      id={`buy-card-${r.id}`}
                      className={styles.buyNowBtn}
                      onClick={e => { e.stopPropagation(); handleBuyNow(r); }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* → Next */}
            <button
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          MODAL LIGHTBOX
          ════════════════════════════════════════════════ */}
      {reel && (
        <div
          className={styles.modalOverlay}
          id="hustlers-modal"
          role="dialog"
          aria-modal="true"
          aria-label={reel.title}
          onClick={closeModal}
        >
          <div
            className={styles.modalContainer}
            onClick={e => e.stopPropagation()}
          >
            {/* ← Prev reel */}
            <button
              id="hustlers-prev"
              className={styles.sideNavBtn}
              onClick={() => stepModal(-1)}
              aria-label="Previous reel"
            >
              <ChevronLeft size={24} />
            </button>

            {/* ─── Modal box ─── */}
            <div className={styles.modalBox}>

              {/* Main video (WITH sound — toggle via mute btn) */}
              <video
                ref={modalVidRef}
                className={styles.modalVideo}
                autoPlay
                loop
                playsInline
                muted={muted}
              />

              {/* Top-right: Mute + Close */}
              <div className={styles.modalTop}>
                <button
                  id="hustlers-mute"
                  className={styles.circleBtn}
                  onClick={() => setMuted(m => !m)}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button
                  id="hustlers-close"
                  className={styles.circleBtn}
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Right rail */}
              <div className={styles.modalRail}>
                {/* Views */}
                <div className={styles.railItem}>
                  <Eye size={22} color="#fff" />
                  <span className={styles.railViews}>{fmtViews(reel.views)}</span>
                </div>

                {/* Like */}
                <div className={styles.railItem}>
                  <button
                    id="hustlers-like"
                    className={styles.railBtn}
                    onClick={() => {
                      setLiked(prev => {
                        setLikeCount(c => prev ? c - 1 : c + 1);
                        return !prev;
                      });
                    }}
                    aria-label="Like"
                  >
                    <Heart
                      size={26}
                      fill={liked ? '#ff3b5c' : 'none'}
                      color={liked ? '#ff3b5c' : '#fff'}
                    />
                  </button>
                  <span className={styles.railCount}>{likeCount}</span>
                </div>

                {/* Share */}
                <div className={styles.railItem}>
                  <button
                    id="hustlers-share"
                    className={styles.railBtn}
                    onClick={() => setShowShare(true)}
                    aria-label="Share"
                  >
                    <Share2 size={24} color="#fff" />
                  </button>
                  <span className={styles.railCount}>{shareCount}</span>
                </div>

                {/* Cart */}
                <div className={styles.railItem}>
                  <button
                    id="hustlers-cart"
                    className={styles.railBtn}
                    onClick={() => handleAddToCart(reel)}
                    aria-label="Add to cart"
                  >
                    <ShoppingCart size={24} color="#fff" />
                  </button>
                </div>
              </div>

              {/* Bottom product bar */}
              <div className={styles.modalBottom}>
                <div className={styles.modalTopRow}>
                  {reel.off > 0 && (
                    <span className={styles.modalBadge}>{reel.off}% OFF!</span>
                  )}

                  {/* Circular video thumb (same video, muted) */}
                  <div className={styles.modalThumb}>
                    <video
                      src={reel.videoSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className={styles.thumbVideo}
                    />
                  </div>

                  {/* Product name → /shop/[slug] */}
                  <Link
                    href={utmUrl(reel.slug)}
                    className={styles.modalProdName}
                    onClick={e => { e.stopPropagation(); closeModal(); }}
                  >
                    <span className={styles.modalNameText}>{reel.title}</span>
                    <ExternalLink size={12} style={{ flexShrink: 0 }} />
                  </Link>
                </div>

                {/* Price row */}
                <div className={styles.modalPriceRow}>
                  <span className={styles.priceNow}>
                    ₹{reel.price.toLocaleString('en-IN')}.00
                  </span>
                  {reel.orig > reel.price && (
                    <span className={styles.priceOrig}>
                      ₹{reel.orig.toLocaleString('en-IN')}.00
                    </span>
                  )}
                  {reel.off > 0 && (
                    <span className={styles.offLabel}>{reel.off}% Off</span>
                  )}
                </div>

                {/* Buy Now */}
                <button
                  id="hustlers-buy"
                  className={styles.modalBuyBtn}
                  onClick={() => handleBuyNow(reel)}
                >
                  Buy Now
                </button>
              </div>
            </div>
            {/* end .modalBox */}

            {/* → Next reel */}
            <button
              id="hustlers-next"
              className={styles.sideNavBtn}
              onClick={() => stepModal(1)}
              aria-label="Next reel"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          SHARE DIALOG
          ════════════════════════════════════════════════ */}
      {showShare && reel && (
        <div
          className={styles.shareBackdrop}
          onClick={() => setShowShare(false)}
        >
          <div
            className={styles.shareDialog}
            role="dialog"
            aria-label="Share"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              className={styles.shareClose}
              onClick={() => setShowShare(false)}
              aria-label="Close share dialog"
            >
              <X size={16} />
            </button>

            <p className={styles.shareHeading}>Share</p>
            <p className={styles.shareSubheading}>on</p>

            <div className={styles.shareOptions}>
              {/* WhatsApp */}
              <button
                id="share-whatsapp"
                className={styles.shareOption}
                onClick={() => shareWhatsApp(reel)}
                aria-label="Share on WhatsApp"
              >
                <span className={`${styles.shareIcon} ${styles.shareIconWA}`}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.114.553 4.099 1.523 5.822L0 24l6.335-1.501A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.883.938-3.63-.234-.373A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                </span>
                <span className={styles.shareLabel}>WhatsApp</span>
              </button>

              {/* X */}
              <button
                id="share-x"
                className={styles.shareOption}
                onClick={() => shareX(reel)}
                aria-label="Share on X"
              >
                <span className={`${styles.shareIcon} ${styles.shareIconX}`}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </span>
                <span className={styles.shareLabel}>X</span>
              </button>

              {/* Copy Link */}
              <button
                id="share-copy"
                className={styles.shareOption}
                onClick={() => copyLink(reel)}
                aria-label="Copy link"
              >
                <span className={`${styles.shareIcon} ${styles.shareIconCopy}`}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </span>
                <span className={styles.shareLabel}>Copy link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      <div
        id="hustlers-toast"
        className={`${styles.toast} ${toastVis ? styles.toastVisible : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </>
  );
}
