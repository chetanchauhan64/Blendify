// ============================================================
// BLENDIFY — Checkout Page (Server Component)
// /checkout
//
// Authentication: required — redirects to /sign-in if not logged in
// Loads user addresses from DB server-side.
// Renders CheckoutClient with pre-loaded data.
// ============================================================
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { CheckoutClient } from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Checkout — BLENDIFY',
  description: 'Secure checkout powered by Razorpay.',
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  // Authenticate — unauthenticated → /sign-in
  const user = await requireAuth();

  // Load addresses from DB
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    include: { country: { select: { name: true, code: true } } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  // Load user loyalty points
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { loyaltyPoints: true },
  });

  return (
    <CheckoutClient
      user={{
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        loyaltyPoints: userRecord?.loyaltyPoints ?? 0,
      }}
      addresses={addresses.map((a) => ({
        id: a.id,
        type: a.type,
        firstName: a.firstName,
        lastName: a.lastName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? undefined,
        city: a.city,
        state: a.state,
        postalCode: a.postalCode,
        country: a.country.name,
        isDefault: a.isDefault,
        label: a.label ?? undefined,
      }))}
    />
  );
}
