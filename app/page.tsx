import type { Metadata } from 'next';
import { HeroSlider }             from '@/components/hero/HeroSlider';
import { USPStrip }               from '@/components/sections/USPStrip';
import { LifestyleBanner }        from '@/components/sections/LifestyleBanner';
import { FlavourCollectionGrid }  from '@/components/sections/FlavourCollectionGrid';
import { ExploreSection }         from '@/components/sections/ExploreSection';
import { BestsellingCombos }      from '@/components/sections/BestsellingCombos';
import { ComboPacks }             from '@/components/sections/ComboPacks';
import { BestCoffeeSachets }      from '@/components/sections/BestCoffeeSachets';
import { BlendifyCommunity }      from '@/components/sections/BlendifyCommunity';
import { StatsCounter }           from '@/components/sections/StatsCounter';
import { VisualStoryGrid }        from '@/components/sections/VisualStoryGrid';
import { StoryImageBlock }        from '@/components/sections/StoryImageBlock';
import { ColdCoffeeCollection }   from '@/components/sections/ColdCoffeeCollection';
import { ShopOurCoffee }          from '@/components/sections/ShopOurCoffee';
import { Testimonials }           from '@/components/sections/Testimonials';
import { ProductShowcase }        from '@/components/sections/ProductShowcase';
import { Newsletter }             from '@/components/sections/Newsletter';

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
      {/* ── Hero ── */}
      <HeroSlider />
      <USPStrip />

      {/* ── Lifestyle Banner ── */}
      <LifestyleBanner />

      {/* ── Flavour Collection Showcase ── */}
      <FlavourCollectionGrid />

      {/* ── Explore Carousel ── */}
      <ExploreSection />

      {/* ── Bestselling Combos (carousel) ── */}
      <BestsellingCombos />

      {/* ── Dedicated Combo Pack Cards ── */}
      <ComboPacks />

      {/* ── Best Coffee Sachets ── */}
      <BestCoffeeSachets />

      {/* ── Community & Social Proof ── */}
      <BlendifyCommunity />

      {/* ── Statistics Counter ── */}
      <StatsCounter />

      {/* ── Video Story Section ── */}
      <VisualStoryGrid />

      {/* ── Image Story Grid ── */}
      <StoryImageBlock />

      {/* ── Cold Coffee Can Collection ── */}
      <ColdCoffeeCollection />

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
