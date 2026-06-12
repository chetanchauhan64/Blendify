// ============================================================
// BLENDIFY — useMounted hook
// Prevents SSR/client hydration mismatches for localStorage-
// backed Zustand stores (regionStore, cartStore, wishlistStore).
//
// Usage: const mounted = useMounted();
//        if (!mounted) return <SkeletonPrice />;
// ============================================================
'use client';

import { useState, useEffect } from 'react';

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}
