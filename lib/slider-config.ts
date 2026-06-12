// lib/slider-config.ts
export interface SlideConfig {
  id: number;
  image: string;
  alt: string;
  accent: string; // dominant color for ambient glow
}

export const SLIDES: SlideConfig[] = [
  {
    id: 1,
    image: '/images/hero/banner-1.png',
    alt: 'Buy Any 3 Coffees Get Hot Chocolate Free',
    accent: '#c9a87c',
  },
  {
    id: 2,
    image: '/images/hero/banner-2.png',
    alt: 'Blendify Premium Coffee Bundle Offer',
    accent: '#b8955a',
  },
  {
    id: 3,
    image: '/images/hero/banner-3.png',
    alt: "India's Largest Variety of Instant Coffees in Sachets",
    accent: '#7c5cbf',
  },
  {
    id: 4,
    image: '/images/hero/banner-4.png',
    alt: 'Guilt Free Hydration Iced Tea',
    accent: '#e8734a',
  },
];

export const AUTOPLAY_INTERVAL = 5000; // ms
export const TRANSITION_DURATION = 0.9; // seconds
