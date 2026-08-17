// ============================================================
// BLENDIFY — Finance Transactions API
// GET /api/admin/finance/transactions
//
// Query params:
//   period        : date period filter
//   dateFrom      : ISO date string
//   dateTo        : ISO date string
//   gateway       : PaymentGateway filter
//   paymentStatus : PaymentStatus filter
//   orderStatus   : OrderStatus filter
//   search        : search on order number or customer email
//   sortBy        : createdAt|amount|gateway|status (default: createdAt)
//   order         : asc|desc (default: desc)
//   page          : number (default: 1)
//   limit         : number (default: 25, max: 100)
//
// Returns paginated transaction records with order + customer info.
// Never exposes gateway secrets, API keys, or credentials.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  period: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'prevMonth', 'thisYear', 'custom']).default('last30'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  gateway: z.enum(['RAZORPAY', 'STRIPE', 'COD', 'WALLET', 'LOYALTY_POINTS']).optional(),
  paymentStatus: z.enum(['PENDING', 'AUTHORIZED', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED', 'CANCELLED']).optional(),
  orderStatus: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUND_INITIATED', 'REFUNDED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'gateway', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

function getPeriodDates(period: string, dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  switch (period) {
    case 'today': return { from: today, to: tomorrow };
    case 'yesterday': return { from: new Date(today.getTime() - 86400000), to: today };
    case 'last7': return { from: new Date(today.getTime() - 6 * 86400000), to: tomorrow };
    case 'last30': return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
    case 'last90': return { from: new Date(today.getTime() - 89 * 86400000), to: tomorrow };
    case 'thisMonth': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    case 'prevMonth': return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
    case 'thisYear': return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1) };
    case 'custom': {
      if (!dateFrom || !dateTo) return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
      return { from: new Date(dateFrom), to: new Date(new Date(dateTo).getTime() + 86400000) };
    }
    default: return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { period, dateFrom, dateTo, gateway, paymentStatus, orderStatus, search, sortBy, order, page, limit } = parseResult.data;
    const { from, to } = getPeriodDates(period, dateFrom, dateTo);

    // Build Prisma where clause
    const where: Prisma.PaymentWhereInput = {
      createdAt: { gte: from, lt: to },
      ...(gateway ? { gateway } : {}),
      ...(paymentStatus ? { status: paymentStatus } : {}),
    };

    // Order status and search require nested filtering
    if (orderStatus || search) {
      const orderWhere: Prisma.OrderWhereInput = {};
      if (orderStatus) orderWhere.status = orderStatus;
      if (search) {
        orderWhere.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { user: { firstName: { contains: search, mode: 'insensitive' } } },
          { user: { lastName: { contains: search, mode: 'insensitive' } } },
          { guestEmail: { contains: search, mode: 'insensitive' } },
        ];
      }
      where.order = orderWhere;
    }

    // Count + fetch in parallel
    const [total, transactions] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              total: true,
              currencyCode: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              guestEmail: true,
            },
          },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Map to safe response (no gateway secrets)
    const data = transactions.map((t) => ({
      id: t.id,
      orderId: t.orderId,
      orderNumber: t.order.orderNumber,
      customerName: t.order.user
        ? `${t.order.user.firstName} ${t.order.user.lastName}`.trim()
        : 'Guest',
      customerEmail: t.order.user?.email ?? t.order.guestEmail ?? '',
      gateway: t.gateway,
      amount: Number(t.amount),
      currencyCode: t.currencyCode,
      paymentStatus: t.status,
      orderStatus: t.order.status,
      orderTotal: Number(t.order.total),
      paidAt: t.paidAt?.toISOString() ?? null,
      refundAmount: t.refundAmount ? Number(t.refundAmount) : null,
      refundedAt: t.refundedAt?.toISOString() ?? null,
      failureCode: t.failureCode,
      failureReason: t.failureReason,
      createdAt: t.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(total / limit);

    return ok({
      transactions: data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
    });
  } catch (err) {
    console.error('[Finance Transactions] Error:', err);
    return serverError('Failed to fetch finance transactions');
  }
}
