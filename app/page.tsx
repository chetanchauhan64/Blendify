import type { Metadata } from 'next';
import { Hero }                 from '@/components/sections/Hero';
import { USPStrip }             from '@/components/sections/USPStrip';
import { FeaturedCollections }  from '@/components/sections/FeaturedCollections';
import { BestSellers }          from '@/components/sections/BestSellers';
import { CategoryGrid }         from '@/components/sections/CategoryGrid';
import { BrandStory }           from '@/components/sections/BrandStory';
import { Testimonials }         from '@/components/sections/Testimonials';
import { Newsletter }           from '@/components/sections/Newsletter';
import { Gallery }              from '@/components/sections/Gallery';

export const metadata: Metadata = {
  title: 'BLENDIFY | The Art of Coffee',
  description: 'Premium specialty coffee sourced from the world\'s finest farms. 100% Arabica, roasted with obsessive care. Made in India.',
  openGraph: {
    title: 'BLENDIFY | The Art of Coffee',
    description: 'Premium specialty coffee sourced from the world\'s finest farms. 100% Arabica. Made in India.',
  },
};

export default function HomePage() {
  return (
    <>
      <Hero />
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
