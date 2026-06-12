import type { Metadata } from 'next';
import { HeroSlider } from '@/components/hero/HeroSlider';
import { USPStrip }             from '@/components/sections/USPStrip';
import { FeaturedCollections }  from '@/components/sections/FeaturedCollections';
import { BestSellers }          from '@/components/sections/BestSellers';
import { CategoryGrid }         from '@/components/sections/CategoryGrid';
import { BrandStory }           from '@/components/sections/BrandStory';
import { Testimonials }         from '@/components/sections/Testimonials';
import { Newsletter }           from '@/components/sections/Newsletter';
import { Gallery }              from '@/components/sections/Gallery';

export const metadata: Metadata = {
  title: 'BLENDIFY — Premium Instant Coffee. Made in India.',
  description: "India's finest flavoured instant coffee. 100% Arabica, no added sugar, USDA organic flavouring.",
  openGraph: {
    title: 'BLENDIFY — Premium Instant Coffee',
    description: "India's finest flavoured instant coffee.",
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <USPStrip />
      <FeaturedCollections />
      <BestSellers />
      <CategoryGrid />
      <BrandStory />
      <Testimonials />
      <Newsletter />
      <Gallery />
    </>
  );
}
