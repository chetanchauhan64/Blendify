'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant, SubscriptionFrequency } from '@/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  couponCode: string;
  couponDiscount: number;
  loyaltyPointsUsed: number;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, variant: ProductVariant, quantity?: number, isSubscription?: boolean, frequency?: SubscriptionFrequency) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  applyLoyaltyPoints: (points: number) => void;

  // Computed
  itemCount: () => number;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      couponCode: '',
      couponDiscount: 0,
      loyaltyPointsUsed: 0,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      addItem: (product, variant, quantity = 1, isSubscription = false, frequency) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.productId === product.id && i.variantId === variant.id && i.isSubscription === isSubscription
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: updated[existingIndex].quantity + quantity,
            };
            return { items: updated };
          }

          const newItem: CartItem = {
            id: `${product.id}-${variant.id}-${isSubscription ? 'sub' : 'one'}-${Date.now()}`,
            productId: product.id,
            variantId: variant.id,
            product,
            variant,
            quantity,
            isSubscription,
            subscriptionFrequency: frequency,
            addedAt: new Date(),
          };

          return { items: [...state.items, newItem], isOpen: true };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== itemId) }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ items: [], couponCode: '', couponDiscount: 0, loyaltyPointsUsed: 0 }),

      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      removeCoupon: () => set({ couponCode: '', couponDiscount: 0 }),

      applyLoyaltyPoints: (points) => set({ loyaltyPointsUsed: points }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => {
          const price = i.isSubscription && i.product.subscriptionPrice
            ? i.product.subscriptionPrice
            : i.variant.price;
          return sum + price * i.quantity;
        }, 0),

      total: () => {
        const sub = get().subtotal();
        const discount = get().couponDiscount;
        const loyaltyValue = get().loyaltyPointsUsed * 0.01; // 1 point = $0.01
        return Math.max(0, sub - discount - loyaltyValue);
      },
    }),
    { name: 'blendify-cart' }
  )
);
