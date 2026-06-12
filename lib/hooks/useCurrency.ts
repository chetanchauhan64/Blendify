// ============================================================
// BLENDIFY — useCurrency hook
// Returns a stable currency object that's safe for both SSR
// and client rendering. Defaults to USD on the server, then
// switches to the user's persisted region after hydration.
// This eliminates the SSR/client hydration mismatch caused
// by the localStorage-backed regionStore.
// ============================================================
'use client';

import { useMounted } from '@/lib/hooks/useMounted';
import { useRegionStore } from '@/lib/store/regionStore';
import { CURRENCIES } from '@/lib/currency';
import type { Currency } from '@/types';

/** Server-safe default — matches what SSR renders */
const SERVER_DEFAULT: Currency = CURRENCIES['USD'];

export function useCurrency(): Currency {
  const { getCurrency } = useRegionStore();
  const mounted = useMounted();
  // Return USD on server/first-paint, real currency after hydration
  return mounted ? getCurrency() : SERVER_DEFAULT;
}
