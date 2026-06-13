'use client';

/**
 * BLENDIFY — StoryImageBlock
 * Image story block below video section.
 * 4 premium storytelling images.
 * - Hover zoom effect
 * - Click opens fullscreen modal lightbox
 * - Close on backdrop click / Escape key
 */

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ArrowLeft, ArrowRight } from 'lucide-react';
import { viewportConfig } from '@/lib/animations';
import styles from './StoryImageBlock.module.css';

interface StoryImage {
  id: string;
  src: string;
  alt: string;
  label: string;
  caption: string;
}

const STORY_IMAGES: StoryImage[] = [
  {
    id: 'si-1',
    src: '/story/coffee-collection.png',
    alt: 'Blendify Premium Coffee Collection — six flavoured instant coffees',
    label: 'The Collection',
    caption: '6 premium flavours. 100% Arabica. Zero compromise.',
  },
  {
    id: 'si-2',
    src: '/story/frother.png',
    alt: 'Blendify Frother Pro — rechargeable milk frother',
    label: 'Frother Pro',
    caption: 'Barista-grade froth at home. Rechargeable. Powerful.',
  },
  {
    id: 'si-3',
    src: '/story/lifestyle.png',
    alt: 'Blendify Lifestyle — premium coffee moment',
    label: 'Your Ritual',
    caption: 'Every cup is a moment. Make it premium.',
  },
  {
    id: 'si-4',
    src: '/images/lifestyle/barista.png',
    alt: 'Blendify Coffee Experience — mug and coffee machine',
    label: 'Coffee Gear',
    caption: 'The complete coffee setup. Equipment + flavours.',
  },
];

export function StoryImageBlock() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + STORY_IMAGES.length) % STORY_IMAGES.length));
  }, []);

  const goNext = useCallback(() => {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % STORY_IMAGES.length));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIndex, goPrev, goNext]);

  // Lock scroll when lightbox open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportConfig}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.eyebrow}>Our Story</span>
          <h2 className={styles.title}>Crafted with Passion</h2>
        </motion.div>

        {/* Image Grid */}
        <div className={styles.grid}>
          {STORY_IMAGES.map((img, index) => (
            <motion.div
              key={img.id}
              className={styles.card}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => openLightbox(index)}
            >
              <div className={styles.imageWrap}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className={styles.image}
                />
                <div className={styles.hoverOverlay}>
                  <ZoomIn size={24} className={styles.zoomIcon} />
                </div>
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardLabel}>{img.label}</span>
                <p className={styles.cardCaption}>{img.caption}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            className={styles.lightboxBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeLightbox}
          >
            <motion.div
              className={styles.lightboxContent}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Close lightbox">
                <X size={20} />
              </button>

              {/* Navigation: prev */}
              <button className={`${styles.lightboxNav} ${styles.navPrev}`} onClick={goPrev} aria-label="Previous image">
                <ArrowLeft size={20} />
              </button>

              {/* Image */}
              <div className={styles.lightboxImageWrap}>
                <Image
                  src={STORY_IMAGES[lightboxIndex].src}
                  alt={STORY_IMAGES[lightboxIndex].alt}
                  fill
                  sizes="90vw"
                  className={styles.lightboxImage}
                  priority
                />
              </div>

              {/* Navigation: next */}
              <button className={`${styles.lightboxNav} ${styles.navNext}`} onClick={goNext} aria-label="Next image">
                <ArrowRight size={20} />
              </button>

              {/* Caption */}
              <div className={styles.lightboxCaption}>
                <span className={styles.lightboxLabel}>{STORY_IMAGES[lightboxIndex].label}</span>
                <p className={styles.lightboxText}>{STORY_IMAGES[lightboxIndex].caption}</p>
                <span className={styles.lightboxCounter}>{lightboxIndex + 1} / {STORY_IMAGES.length}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
