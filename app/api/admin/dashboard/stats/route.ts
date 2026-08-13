// ============================================================
// BLENDIFY — Dashboard Stats API
// GET /api/admin/dashboard/stats
// ============================================================
import { NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  await requireAdminAccess();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalOrders, prevOrders,
    totalRevenue, prevRevenue,
    totalCustomers, prevCustomers,
    pendingReviews,
    activeCoupons, activeFlashSales,
    totalGiftCardBalance,
    loyaltyStats,
    recentOrders,
    topProducts,
    campaignStats,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: thirtyDaysAgo }, status: { notIn: ['CANCELLED', 'REFUNDED'] } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }, status: { notIn: ['CANCELLED', 'REFUNDED'] } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.flashSale.count({ where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } }),
    prisma.giftCard.aggregate({ _sum: { balance: true }, where: { isActive: true } }),
    prisma.user.groupBy({ by: ['loyaltyTier'], _count: { id: true }, _sum: { loyaltyPoints: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        id: true, orderNumber: true, total: true, status: true, createdAt: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, unitPrice: true },
      where: { order: { createdAt: { gte: thirtyDaysAgo } } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    prisma.emailCampaign.aggregate({
      _sum: { sentCount: true, openCount: true, clickCount: true },
      where: { status: 'SENT' },
    }),
  ]);

  const prevRev = Number(prevRevenue._sum?.total ?? 0);
  const currRev = Number(totalRevenue._sum?.total ?? 0);

  return NextResponse.json({
    success: true,
    data: {
      kpis: {
        orders: {
          value: totalOrders,
          trend: prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0,
        },
        revenue: {
          value: currRev,
          trend: prevRev > 0 ? ((currRev - prevRev) / prevRev) * 100 : 0,
        },
        customers: {
          value: totalCustomers,
          trend: prevCustomers > 0 ? ((totalCustomers - prevCustomers) / prevCustomers) * 100 : 0,
        },
        pendingReviews,
        activeCoupons,
        activeFlashSales,
        giftCardBalance: Number(totalGiftCardBalance._sum?.balance ?? 0),
      },
      loyaltyStats,
      recentOrders: recentOrders.map((o) => ({
        ...o,
        totalAmount: Number(o.total),
      })),
      topProducts,
      campaignStats: {
        totalSent: campaignStats._sum?.sentCount ?? 0,
        totalOpens: campaignStats._sum?.openCount ?? 0,
        totalClicks: campaignStats._sum?.clickCount ?? 0,
      },
    },
  });
}
