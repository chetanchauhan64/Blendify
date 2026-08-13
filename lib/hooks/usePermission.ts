// ============================================================
// BLENDIFY — Permission Hooks (Phase 1)
// RBAC-ready permission system. Currently open to ADMIN/SUPER_ADMIN.
// Phase 5 will overlay role-specific permission rules.
// ============================================================
'use client';

import { useCallback } from 'react';

// ── Permission Actions ──────────────────────────────────────
export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export' | 'bulk';

// ── Module identifiers ──────────────────────────────────────
export type AdminModule =
  | 'reviews'
  | 'coupons'
  | 'discounts'
  | 'flash-sales'
  | 'bundles'
  | 'gift-cards'
  | 'loyalty'
  | 'referrals'
  | 'newsletter'
  | 'email-campaigns'
  | 'push-notifications'
  | 'announcement-bars'
  | 'banners'
  | 'popups'
  | 'dashboard';

// ── Role type ────────────────────────────────────────────────
export type AdminRole = 'ADMIN' | 'SUPER_ADMIN' | 'WAREHOUSE' | 'SUPPORT';

// ── Default permission matrix ────────────────────────────────
// Phase 5 RBAC will replace this with DB-driven rules.
const DEFAULT_PERMISSIONS: Record<AdminRole, Record<AdminModule, PermissionAction[]>> = {
  SUPER_ADMIN: {
    reviews: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    coupons: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    discounts: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'flash-sales': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    bundles: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'gift-cards': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    loyalty: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    referrals: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    newsletter: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'email-campaigns': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'push-notifications': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'announcement-bars': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    banners: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    popups: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    dashboard: ['view', 'export'],
  },
  ADMIN: {
    reviews: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    coupons: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    discounts: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'flash-sales': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    bundles: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'gift-cards': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    loyalty: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    referrals: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    newsletter: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'email-campaigns': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'push-notifications': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    'announcement-bars': ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    banners: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    popups: ['view', 'create', 'update', 'delete', 'export', 'bulk'],
    dashboard: ['view', 'export'],
  },
  WAREHOUSE: {
    reviews: ['view'],
    coupons: ['view'],
    discounts: ['view'],
    'flash-sales': ['view'],
    bundles: ['view'],
    'gift-cards': ['view'],
    loyalty: ['view', 'export'],
    referrals: ['view'],
    newsletter: [],
    'email-campaigns': [],
    'push-notifications': [],
    'announcement-bars': [],
    banners: [],
    popups: [],
    dashboard: ['view'],
  },
  SUPPORT: {
    reviews: ['view', 'update', 'bulk'],
    coupons: ['view'],
    discounts: ['view'],
    'flash-sales': ['view'],
    bundles: ['view'],
    'gift-cards': ['view', 'update'],
    loyalty: ['view', 'create', 'export'],
    referrals: ['view'],
    newsletter: ['view', 'export'],
    'email-campaigns': ['view'],
    'push-notifications': ['view'],
    'announcement-bars': ['view'],
    banners: ['view'],
    popups: ['view'],
    dashboard: ['view'],
  },
};

// ── Client-side hook ─────────────────────────────────────────
export function usePermission(role: AdminRole = 'ADMIN') {
  const can = useCallback(
    (module: AdminModule, action: PermissionAction): boolean => {
      const perms = DEFAULT_PERMISSIONS[role]?.[module];
      if (!perms) return false;
      return perms.includes(action);
    },
    [role],
  );

  const canAny = useCallback(
    (module: AdminModule, actions: PermissionAction[]): boolean => {
      return actions.some((a) => can(module, a));
    },
    [can],
  );

  const canAll = useCallback(
    (module: AdminModule, actions: PermissionAction[]): boolean => {
      return actions.every((a) => can(module, a));
    },
    [can],
  );

  return { can, canAny, canAll };
}

// ── Server-side permission check (no React) ──────────────────
export function checkPermission(
  role: AdminRole,
  module: AdminModule,
  action: PermissionAction,
): boolean {
  const perms = DEFAULT_PERMISSIONS[role]?.[module];
  if (!perms) return false;
  return perms.includes(action);
}
