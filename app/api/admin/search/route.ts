// ============================================================
// BLENDIFY — Global Admin Search Route
// GET /api/admin/search?query=...&limit=10
// ============================================================
import { withAdmin, ok, parseSearchParams, badRequest } from '@/lib/utils/api';
import { prisma } from '@/lib/db/prisma';

export const GET = withAdmin(async (req) => {
  const { query, limit: limitStr } = parseSearchParams(req.url);
  if (!query || query.trim().length < 2) return badRequest('Query must be at least 2 characters');

  const limit = Math.min(parseInt(limitStr ?? '10', 10), 50);
  const q = query.trim();

  // Search across modules in parallel
  const [reviews, coupons, campaigns, giftCards, flashSales] = await Promise.all([
    prisma.review.findMany({
      where: { OR: [{ authorName: { contains: q, mode: 'insensitive' } }, { body: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, authorName: true, rating: true, status: true },
      take: Math.ceil(limit / 4),
    }),
    prisma.coupon.findMany({
      where: { OR: [{ code: { contains: q.toUpperCase() } }, { description: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, code: true, type: true, isActive: true },
      take: Math.ceil(limit / 4),
    }),
    prisma.emailCampaign.findMany({
      where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, name: true, status: true },
      take: Math.ceil(limit / 4),
    }),
    prisma.giftCard.findMany({
      where: { OR: [{ code: { contains: q.toUpperCase() } }, { issuedToEmail: { contains: q, mode: 'insensitive' } }] },
      select: { id: true, code: true, balance: true, isActive: true },
      take: Math.ceil(limit / 4),
    }),
    prisma.flashSale.findMany({
      where: { name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, isActive: true },
      take: Math.ceil(limit / 4),
    }),
  ]);

  const results = [
    ...reviews.map((r: { id: string; authorName: string; status: string; rating: number }) => ({
      module: 'reviews',
      label: r.authorName,
      description: `Review · ${r.status} · ${r.rating}★`,
      href: `/admin/reviews/${r.id}`,
    })),
    ...coupons.map((c: { id: string; code: string; type: string; isActive: boolean }) => ({
      module: 'coupons',
      label: c.code,
      description: `Coupon · ${c.type} · ${c.isActive ? 'Active' : 'Inactive'}`,
      href: `/admin/coupons/${c.id}`,
    })),
    ...campaigns.map((c: { id: string; name: string; status: string }) => ({
      module: 'email-campaigns',
      label: c.name,
      description: `Email Campaign · ${c.status}`,
      href: `/admin/email-campaigns/${c.id}`,
    })),
    ...giftCards.map((g: { id: string; code: string; balance: unknown }) => ({
      module: 'gift-cards',
      label: g.code,
      description: `Gift Card · Balance: ₹${Number(g.balance).toFixed(2)}`,
      href: `/admin/gift-cards/${g.id}`,
    })),
    ...flashSales.map((f: { id: string; name: string; isActive: boolean }) => ({
      module: 'flash-sales',
      label: f.name,
      description: `Flash Sale · ${f.isActive ? 'Active' : 'Inactive'}`,
      href: `/admin/flash-sales/${f.id}`,
    })),
  ].slice(0, limit);

  return ok({ results });
});
