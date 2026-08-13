// ============================================================
// BLENDIFY — Gift Card Repository
// ============================================================
import { Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResult } from './base.repository';
import type { GiftCardFiltersSchema } from '@/lib/validations/admin.schemas';
import type { z } from 'zod';

type GiftCardFiltersInput = z.infer<typeof GiftCardFiltersSchema>;

export type GiftCardWithTransactions = {
  id: string;
  code: string;
  value: number;
  balance: number;
  currencyCode: string;
  isActive: boolean;
  expiresAt: Date | null;
  note: string | null;
  issuedToEmail: string | null;
  issuedToUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    note: string | null;
    orderId: string | null;
    createdAt: Date;
  }>;
};

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [4, 4, 4, 4];
  return segments.map((len) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  ).join('-');
}

export class GiftCardRepository extends BaseRepository {
  async findAll(filters: GiftCardFiltersInput): Promise<PaginatedResult<GiftCardWithTransactions>> {
    const { page = 1, limit = 25, sortBy = 'createdAt', sortOrder = 'desc', search, isActive, hasBalance, issuedToEmail, dateFrom, dateTo } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.GiftCardWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(hasBalance !== undefined && hasBalance ? { balance: { gt: 0 } } : hasBalance === false ? { balance: { equals: 0 } } : {}),
      ...(issuedToEmail && { issuedToEmail: { contains: issuedToEmail, mode: 'insensitive' } }),
      ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {}),
      ...(search ? {
        OR: [
          { code: { contains: search.toUpperCase() } },
          { issuedToEmail: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.giftCard.findMany({
        where,
        include: { transactions: { orderBy: { createdAt: 'desc' } } },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      this.db.giftCard.count({ where }),
    ]);

    const mapped = data.map((gc) => ({
      ...gc,
      value: Number(gc.value),
      balance: Number(gc.balance),
      transactions: gc.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
      })),
    }));

    return this.paginate(mapped as GiftCardWithTransactions[], total, page, limit);
  }

  async findById(id: string): Promise<GiftCardWithTransactions | null> {
    const gc = await this.db.giftCard.findUnique({
      where: { id },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!gc) return null;
    return {
      ...gc,
      value: Number(gc.value),
      balance: Number(gc.balance),
      transactions: gc.transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
      })),
    } as GiftCardWithTransactions;
  }

  async findByCode(code: string) {
    return this.db.giftCard.findUnique({ where: { code: code.toUpperCase() } });
  }

  async create(data: {
    value: number;
    currencyCode: string;
    issuedToEmail?: string;
    issuedToUserId?: string;
    expiresAt?: Date;
    note?: string;
    createdById?: string;
    code?: string;
  }) {
    const code = data.code ?? generateCode();
    return this.db.giftCard.create({
      data: {
        code,
        value: data.value,
        balance: data.value,
        currencyCode: data.currencyCode,
        issuedToEmail: data.issuedToEmail ?? null,
        issuedToUserId: data.issuedToUserId ?? null,
        expiresAt: data.expiresAt ?? null,
        note: data.note ?? null,
        createdById: data.createdById ?? null,
      },
    });
  }

  async createBulk(count: number, data: {
    value: number;
    currencyCode: string;
    expiresAt?: Date;
    note?: string;
    createdById?: string;
  }) {
    const cards = Array.from({ length: count }, () => ({
      code: generateCode(),
      value: data.value,
      balance: data.value,
      currencyCode: data.currencyCode,
      expiresAt: data.expiresAt ?? null,
      note: data.note ?? null,
      createdById: data.createdById ?? null,
    }));
    return this.db.giftCard.createMany({ data: cards, skipDuplicates: true });
  }

  async update(id: string, data: { isActive?: boolean; expiresAt?: Date | null; note?: string; balance?: number; updatedById?: string }) {
    return this.db.giftCard.update({ where: { id }, data });
  }

  async recordTransaction(data: {
    giftCardId: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    orderId?: string;
    userId?: string;
    note?: string;
  }) {
    return this.db.$transaction([
      this.db.giftCardTransaction.create({ data }),
      this.db.giftCard.update({
        where: { id: data.giftCardId },
        data: { balance: data.balanceAfter },
      }),
    ]);
  }

  async getStats() {
    const [total, active, totalValue, totalBalance] = await Promise.all([
      this.db.giftCard.count(),
      this.db.giftCard.count({ where: { isActive: true } }),
      this.db.giftCard.aggregate({ _sum: { value: true } }),
      this.db.giftCard.aggregate({ _sum: { balance: true } }),
    ]);
    return {
      total,
      active,
      totalValue: Number(totalValue._sum.value ?? 0),
      totalBalance: Number(totalBalance._sum.balance ?? 0),
      totalRedeemed: Number(totalValue._sum.value ?? 0) - Number(totalBalance._sum.balance ?? 0),
    };
  }
}

export const giftCardRepository = new GiftCardRepository();
