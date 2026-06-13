import type { Metadata } from 'next';
import { HeroSlider }          from '@/components/hero/HeroSlider';
import { USPStrip }            from '@/components/sections/USPStrip';
import { ExploreSection }      from '@/components/sections/ExploreSection';
import { BestsellingCombos }   from '@/components/sections/BestsellingCombos';
import { BestCoffeeSachets }   from '@/components/sections/BestCoffeeSachets';
import { BlendifyCommunity }   from '@/components/sections/BlendifyCommunity';
import { StatsCounter }        from '@/components/sections/StatsCounter';
import { VisualStoryGrid }     from '@/components/sections/VisualStoryGrid';
import { ShopOurCoffee }       from '@/components/sections/ShopOurCoffee';
import { Testimonials }        from '@/components/sections/Testimonials';
import { ProductShowcase }     from '@/components/sections/ProductShowcase';
import { Newsletter }          from '@/components/sections/Newsletter';

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

      {/* ── Product Showcase Sections ── */}
      <ExploreSection />
      <BestsellingCombos />
      <BestCoffeeSachets />

      {/* ── Community & Social Proof ── */}
      <BlendifyCommunity />

      {/* ── 100% Pure Arabica Counter ── */}
      <StatsCounter />

      {/* ── Visual Story Grid ── */}
      <VisualStoryGrid />

      {/* ── Shop Our Coffee ── */}
      <ShopOurCoffee />

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── Product Photography Showcase ── */}
      <ProductShowcase />

      {/* ── Newsletter ── */}
      <Newsletter />
    </>
  );
}
