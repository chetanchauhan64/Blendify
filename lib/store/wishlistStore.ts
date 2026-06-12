'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WishlistItem, Product, ProductVariant } from '@/types';

interface WishlistState {
  items: WishlistItem[];
  addItem: (product: Product, variant: ProductVariant) => void;
  removeItem: (productId: string, variantId: string) => void;
  toggleItem: (product: Product, variant: ProductVariant) => void;
  isWishlisted: (productId: string, variantId: string) => boolean;
  itemCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, variant) => {
        if (get().isWishlisted(product.id, variant.id)) return;
        set((s) => ({
          items: [...s.items, { productId: product.id, variantId: variant.id, addedAt: new Date() }],
        }));
      },

      removeItem: (productId, variantId) => {
        set((s) => ({
          items: s.items.filter((i) => !(i.productId === productId && i.variantId === variantId)),
        }));
      },

      toggleItem: (product, variant) => {
        if (get().isWishlisted(product.id, variant.id)) {
          get().removeItem(product.id, variant.id);
        } else {
          get().addItem(product, variant);
        }
      },

      isWishlisted: (productId, variantId) =>
        get().items.some((i) => i.productId === productId && i.variantId === variantId),

      itemCount: () => get().items.length,
    }),
    { name: 'blendify-wishlist' }
  )
);
