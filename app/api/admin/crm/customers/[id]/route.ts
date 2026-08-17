// ============================================================
// BLENDIFY — Customer 360° Profile & Action API
// GET /api/admin/crm/customers/[id]
// PUT /api/admin/crm/customers/[id]
//
// GET: Returns comprehensive customer 360° view including
//      orders, loyalty ledger, referrals, reviews, coupon usages,
//      and return requests.
// PUT: Allows admin to suspend/reactivate customer with AuditLog.
//
// Never exposes password hashes, JWTs, or private secrets.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError, badRequest, notFound } from '@/lib/utils/api';
import { z } from 'zod';

const UpdateSchema = z.object({
  isActive: z.boolean(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminAccess();
    const { id } = await context.params;

    if (!id) return badRequest('Customer ID is required');

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        loyaltyPoints: true,
        loyaltyTier: true,
        referralCode: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        referredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        addresses: {
          select: {
            id: true,
            type: true,
            line1: true,
            line2: true,
            city: true,
            state: true,
            postalCode: true,
            isDefault: true,
            country: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            subtotal: true,
            tax: true,
            discount: true,
            loyaltyDiscount: true,
            shippingCost: true,
            total: true,
            currencyCode: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                productName: true,
                variantName: true,
                quantity: true,
                unitPrice: true,
                totalPrice: true,
                imageUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        loyaltyTransactions: {
          select: {
            id: true,
            type: true,
            points: true,
            balance: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        referrals: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            loyaltyTier: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            title: true,
            body: true,
            status: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        couponUsages: {
          select: {
            id: true,
            usedAt: true,
            coupon: {
              select: {
                id: true,
                code: true,
                type: true,
                value: true,
              },
            },
          },
          orderBy: { usedAt: 'desc' },
        },
        returnRequests: {
          select: {
            id: true,
            orderId: true,
            status: true,
            reason: true,
            refundAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return notFound('Customer not found');
    }

    // Compute customer lifetime financials safely
    const REVENUE_STATUSES = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const eligibleOrders = user.orders.filter(o => REVENUE_STATUSES.includes(o.status));
    const totalOrders = eligibleOrders.length;
    const totalSpent = eligibleOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const aov = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const cancelledOrders = user.orders.filter(o => o.status === 'CANCELLED').length;
    const totalRefunded = user.returnRequests
      .filter(r => r.status === 'COMPLETED' || r.status === 'REFUND_INITIATED')
      .reduce((sum, r) => sum + Number(r.refundAmount ?? 0), 0);

    const firstOrderDate = eligibleOrders.length > 0
      ? eligibleOrders[eligibleOrders.length - 1].createdAt.toISOString()
      : null;
    const lastOrderDate = eligibleOrders.length > 0
      ? eligibleOrders[0].createdAt.toISOString()
      : null;

    return ok({
      customer: {
        ...user,
        name: `${user.firstName} ${user.lastName}`.trim(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        financials: {
          totalOrders,
          allOrdersCount: user.orders.length,
          totalSpent,
          aov,
          totalRefunded,
          cancelledOrders,
          firstOrderDate,
          lastOrderDate,
        },
        orders: user.orders.map(o => ({
          ...o,
          subtotal: Number(o.subtotal),
          tax: Number(o.tax),
          discount: Number(o.discount) + Number(o.loyaltyDiscount),
          shippingCost: Number(o.shippingCost),
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
          items: o.items.map(i => ({
            ...i,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
          })),
        })),
        loyaltyTransactions: user.loyaltyTransactions.map(l => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        })),
        referrals: user.referrals.map(r => ({
          ...r,
          name: `${r.firstName} ${r.lastName}`.trim(),
          createdAt: r.createdAt.toISOString(),
        })),
        reviews: user.reviews.map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
        couponUsages: user.couponUsages.map(c => ({
          ...c,
          usedAt: c.usedAt.toISOString(),
          coupon: {
            ...c.coupon,
            value: Number(c.coupon.value),
          },
        })),
        returnRequests: user.returnRequests.map(r => ({
          ...r,
          refundAmount: r.refundAmount ? Number(r.refundAmount) : 0,
          createdAt: r.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    console.error('[Customer 360 Detail] Error:', err);
    return serverError('Failed to fetch customer 360 profile');
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminAccess();
    const { id } = await context.params;

    if (!id) return badRequest('Customer ID is required');

    const body = await req.json().catch(() => ({}));
    const parseResult = UpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest('Invalid request body', parseResult.error.flatten().fieldErrors);
    }

    const { isActive } = parseResult.data;

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, firstName: true, lastName: true, email: true, isActive: true, role: true },
    });

    if (!existing) {
      return notFound('Customer not found');
    }

    if (existing.role !== 'CUSTOMER') {
      return badRequest('Cannot modify administrative or staff accounts through CRM');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
    });

    // Structured Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'UPDATE',
          module: 'crm',
          entityId: id,
          entityLabel: `Customer ${isActive ? 'Reactivation' : 'Suspension'}: ${existing.firstName} ${existing.lastName} (${existing.email})`,
          before: { isActive: existing.isActive },
          after: { isActive: updated.isActive },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch (auditErr) {
      console.warn('[CRM Audit Log] Non-critical error creating audit log:', auditErr);
    }

    return ok({
      success: true,
      message: `Customer ${isActive ? 'reactivated' : 'suspended'} successfully`,
      customer: updated,
    });
  } catch (err) {
    console.error('[Customer Update] Error:', err);
    return serverError('Failed to update customer status');
  }
}
