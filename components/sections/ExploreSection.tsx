'use client';

/**
 * BLENDIFY — Section 1: Explore
 * Horizontal carousel with all flavoured instant coffees
 */

import { EXPLORE_PRODUCTS } from '@/lib/data/showcase-products';
import { ProductCarouselSection } from './ProductCarouselSection';

export function ExploreSection() {
  return (
    <ProductCarouselSection
      title="Explore"
      products={EXPLORE_PRODUCTS}
      viewAllHref="/shop?category=explore"
      dark={false}
    />
  );
}
