'use client';

/**
 * BLENDIFY — Section 2: Our Bestselling Combos
 * Deep maroon background, horizontal carousel
 */

import { COMBO_PRODUCTS } from '@/lib/data/showcase-products';
import { ProductCarouselSection } from './ProductCarouselSection';

export function BestsellingCombos() {
  return (
    <ProductCarouselSection
      title="Our Bestselling Combos"
      products={COMBO_PRODUCTS}
      viewAllHref="/shop?category=combos"
      dark={true}
    />
  );
}
