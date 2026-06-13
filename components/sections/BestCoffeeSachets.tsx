'use client';

/**
 * BLENDIFY — Section 3: Best Coffee Sachets in India
 * Light cream background, horizontal carousel
 */

import { SACHET_PRODUCTS } from '@/lib/data/showcase-products';
import { ProductCarouselSection } from './ProductCarouselSection';

export function BestCoffeeSachets() {
  return (
    <ProductCarouselSection
      title="Best Coffee Sachets in India"
      products={SACHET_PRODUCTS}
      viewAllHref="/shop?category=sachets"
      dark={false}
    />
  );
}
