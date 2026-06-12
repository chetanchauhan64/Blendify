// ============================================================
// BLENDIFY — Order Repository
// ============================================================
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';
import {
  BaseRepository,
  PaginatedResult,
  PaginationParams,
} from './base.repository';

// ── Filter Type ─────────────────────────────────────────────

export type OrderFilters = {
  userId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

// ── Include Shapes ──────────────────────────────────────────

const ORDER_LIST_INCLUDE = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  items: {
    include: {
      product: { select: { name: true, slug: true } },
      variant: { select: { name: true, sku: true } },
    },
  },
  shippingAddress: true,
  payments: {
    select: { gateway: true, status: true, amount: true },
  },
  shipments: {
    select: { status: true, trackingNumber: true, carrier: true },
  },
} satisfies Prisma.OrderInclude;

const ORDER_DETAIL_INCLUDE = {
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  items: {
    include: {
      product: { select: { name: true, slug: true } },
      variant: { select: { name: true, sku: true } },
    },
  },
  shippingAddress: true,
  billingAddress: true,
  payments: {
    select: { gateway: true, status: true, amount: true },
  },
  shipments: {
    select: { status: true, trackingNumber: true, carrier: true },
  },
  timeline: { orderBy: { createdAt: 'asc' as const } },
  coupon: { select: { code: true, type: true, value: true } },
  returnRequests: true,
} satisfies Prisma.OrderInclude;

// ── Payload Types ───────────────────────────────────────────

export type OrderListItem = Prisma.OrderGetPayload<{
  include: typeof ORDER_LIST_INCLUDE;
}>;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof ORDER_DETAIL_INCLUDE;
}>;

// ── Repository Class ────────────────────────────────────────

export class OrderRepository extends BaseRepository {
  async findById(id: string): Promise<OrderWithDetails | null> {
    return this.db.order.findUnique({
      where: { id },
      include: ORDER_DETAIL_INCLUDE,
    });
  }

  async findByOrderNumber(
    orderNumber: string,
  ): Promise<OrderListItem | null> {
    return this.db.order.findUnique({
      where: { orderNumber },
      include: ORDER_LIST_INCLUDE,
    });
  }

  async findByUserId(
    userId: string,
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<OrderListItem>> {
    const { page = 1, limit = 10 } = pagination;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const [orders, total] = await Promise.all([
      this.db.order.findMany({
        where: { userId },
        include: ORDER_LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.db.order.count({ where: { userId } }),
    ]);

    return this.paginate(orders, total, page, limit);
  }

  async findMany(
    filters: OrderFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResult<OrderListItem>> {
    const { page = 1, limit = 20 } = pagination;
    const { skip, take } = this.getPaginationOffset(page, limit);
    const where = this.buildWhereClause(filters);

    const [orders, total] = await Promise.all([
      this.db.order.findMany({
        where,
        include: ORDER_LIST_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.db.order.count({ where }),
    ]);

    return this.paginate(orders, total, page, limit);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    message: string,
    isPublic = true,
  ) {
    return this.db.$transaction([
      this.db.order.update({ where: { id }, data: { status } }),
      this.db.orderTimeline.create({
        data: { orderId: id, status, message, isPublic },
      }),
    ]);
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus) {
    return this.db.order.update({
      where: { id },
      data: { paymentStatus },
    });
  }

  async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const count = await this.db.order.count();
    const seq = String(count + 1).padStart(5, '0');
    return `BLN-${year}${month}${day}-${seq}`;
  }

  async getRevenueStats(from: Date, to: Date) {
    return this.db.order.aggregate({
      where: {
        createdAt: { gte: from, lte: to },
        paymentStatus: 'PAID',
      },
      _sum: { total: true, totalUsd: true },
      _count: { id: true },
      _avg: { total: true },
    });
  }

  async getOrderCountByStatus() {
    return this.db.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });
  }

  private buildWhereClause(
    filters: OrderFilters,
  ): Prisma.OrderWhereInput {
    const where: Prisma.OrderWhereInput = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.search) {
      where.OR = [
        {
          orderNumber: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          guestEmail: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          user: {
            OR: [
              {
                email: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
              {
                firstName: {
                  contains: filters.search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
      ];
    }

    return where;
  }
}

export const orderRepository = new OrderRepository();
