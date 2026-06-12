'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrencyCode, Region } from '@/types';
import { CURRENCIES, REGIONS } from '@/lib/currency';

interface RegionState {
  region: Region;
  currency: CurrencyCode;
  setRegion: (region: Region) => void;
  setCurrency: (currency: CurrencyCode) => void;
  getCurrency: () => (typeof CURRENCIES)[CurrencyCode];
  getRegion: () => (typeof REGIONS)[Region];
}

export const useRegionStore = create<RegionState>()(
  persist(
    (set, get) => ({
      region: 'IN',
      currency: 'INR',

      setRegion: (region) => {
        const regionConfig = REGIONS[region];
        set({ region, currency: regionConfig.currency });
      },

      setCurrency: (currency) => set({ currency }),

      getCurrency: () => CURRENCIES[get().currency],

      getRegion: () => REGIONS[get().region],
    }),
    { name: 'blendify-region' }
  )
);
