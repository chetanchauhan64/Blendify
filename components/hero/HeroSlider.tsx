'use client';
import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { SLIDES } from '@/lib/slider-config';
import { useSliderAnimation } from '@/lib/hooks/useSliderAnimation';
import { useCursorEffect } from '@/lib/hooks/useCursorEffect';
import { HeroSlide } from './HeroSlide';
import { SliderNavigation } from './SliderNavigation';
import { CursorNavigation } from './CursorNavigation';
import styles from './HeroSlider.module.css';

export function HeroSlider() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { current, prev, direction, progress, paused, setPaused, goTo, next, prevSlide } =
    useSliderAnimation();
  const { side, pos, visible } = useCursorEffect(containerRef);

  const handleClick = () => {
    if (side === 'left') prevSlide();
    else if (side === 'right') next();
  };

  // Touch / drag support with Embla
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });

  return (
    <section
      className={styles.heroSlider}
      aria-label="Hero Banner Slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Main clickable+draggable area */}
      <div
        ref={containerRef}
        className={`${styles.track} ${side !== 'center' ? styles.trackPointer : ''}`}
        onClick={handleClick}
        role="presentation"
      >
        {/* Slides with AnimatePresence for exit animations */}
        <AnimatePresence initial={false} custom={direction}>
          {SLIDES.map((slide, i) =>
            i === current ? (
              <HeroSlide
                key={slide.id}
                slide={slide}
                direction={direction}
                isActive={true}
              />
            ) : null,
          )}
        </AnimatePresence>

        {/* Custom cursor overlay */}
        <CursorNavigation side={side} pos={pos} visible={visible} />
      </div>

      {/* Navigation dots with progress ring */}
      <SliderNavigation
        total={SLIDES.length}
        current={current}
        progress={progress}
        onSelect={(i) => goTo(i, i > current ? 1 : -1)}
      />

      {/* Screen-reader live region */}
      <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
        Slide {current + 1} of {SLIDES.length}: {SLIDES[current].alt}
      </div>
    </section>
  );
}
