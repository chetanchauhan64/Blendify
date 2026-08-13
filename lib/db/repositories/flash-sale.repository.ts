// ============================================================
// BLENDIFY — Flash Sale Repository
// ============================================================
import { Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResult } from './base.repository';
import type { CreateFlashSaleInput, FlashSaleFiltersSchema } from '@/lib/validations/admin.schemas';
import type { z } from 'zod';

type FlashSaleFiltersInput = z.infer<typeof FlashSaleFiltersSchema>;

export type FlashSaleStatus = 'active' | 'scheduled' | 'expired' | 'inactive';

export type FlashSaleWithItems = {
  id: string;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  sortOrder: number;
  startsAt: Date;
  endsAt: Date;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    sortOrder: number;
    product: { id: string; name: string; slug: string; basePrice: number };
    variant: { id: string; name: string; sku: string; price: number } | null;
  }>;
  _count: { items: number };
};

function getFlashSaleStatus(sale: { isActive: boolean; startsAt: Date; endsAt: Date }): FlashSaleStatus {
  if (!sale.isActive) return 'inactive';
  const now = new Date();
  if (sale.startsAt > now) return 'scheduled';
  if (sale.endsAt < now) return 'expired';
  return 'active';
}

export class FlashSaleRepository extends BaseRepository {
  async findAll(filters: FlashSaleFiltersInput): Promise<PaginatedResult<FlashSaleWithItems & { computedStatus: FlashSaleStatus }>> {
    const { page = 1, limit = 25, sortBy = 'createdAt', sortOrder = 'desc', search, status, dateFrom, dateTo } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const now = new Date();
    const where: Prisma.FlashSaleWhereInput = {
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(dateFrom || dateTo ? { startsAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {}),
      ...(status === 'active' ? { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } } : {}),
      ...(status === 'scheduled' ? { isActive: true, startsAt: { gt: now } } : {}),
      ...(status === 'expired' ? { endsAt: { lt: now } } : {}),
      ...(status === 'inactive' ? { isActive: false } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.flashSale.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, slug: true, basePrice: true } },
              variant: { select: { id: true, name: true, sku: true, price: true } },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: { select: { items: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take,
      }),
      this.db.flashSale.count({ where }),
    ]);

    const withStatus = data.map((sale) => ({
      ...sale,
      discountValue: Number(sale.discountValue),
      items: sale.items.map((item) => ({
        ...item,
        product: { ...item.product, basePrice: Number(item.product.basePrice) },
        variant: item.variant ? { ...item.variant, price: Number(item.variant.price) } : null,
      })),
      computedStatus: getFlashSaleStatus(sale),
    }));

    return this.paginate(withStatus as (FlashSaleWithItems & { computedStatus: FlashSaleStatus })[], total, page, limit);
  }

  async findById(id: string): Promise<(FlashSaleWithItems & { computedStatus: FlashSaleStatus }) | null> {
    const sale = await this.db.flashSale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, basePrice: true } },
            variant: { select: { id: true, name: true, sku: true, price: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { items: true } },
      },
    });
    if (!sale) return null;
    return {
      ...sale,
      discountValue: Number(sale.discountValue),
      items: sale.items.map((item) => ({
        ...item,
        product: { ...item.product, basePrice: Number(item.product.basePrice) },
        variant: item.variant ? { ...item.variant, price: Number(item.variant.price) } : null,
      })),
      computedStatus: getFlashSaleStatus(sale),
    } as FlashSaleWithItems & { computedStatus: FlashSaleStatus };
  }

  async create(data: CreateFlashSaleInput, createdById?: string) {
    const { items, ...rest } = data;
    return this.db.flashSale.create({
      data: {
        ...rest,
        createdById: createdById ?? null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId ?? null,
            sortOrder: item.sortOrder ?? 0,
          })),
        },
      },
      include: { items: true, _count: { select: { items: true } } },
    });
  }

  async update(id: string, data: Partial<CreateFlashSaleInput>, updatedById?: string) {
    const { items, ...rest } = data;
    return this.db.$transaction(async (tx) => {
      if (items) {
        await tx.flashSaleItem.deleteMany({ where: { flashSaleId: id } });
        await tx.flashSaleItem.createMany({
          data: items.map((item) => ({
            flashSaleId: id,
            productId: item.productId,
            variantId: item.variantId ?? null,
            sortOrder: item.sortOrder ?? 0,
          })),
        });
      }
      return tx.flashSale.update({
        where: { id },
        data: { ...rest, updatedById: updatedById ?? null },
        include: { items: true, _count: { select: { items: true } } },
      });
    });
  }

  async delete(id: string) {
    await this.db.flashSale.delete({ where: { id } });
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.db.flashSale.update({ where: { id }, data: { isActive } });
  }

  async getActiveFlashSales() {
    const now = new Date();
    return this.db.flashSale.findMany({
      where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
      include: { items: { include: { product: true, variant: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }
}

export const flashSaleRepository = new FlashSaleRepository();
