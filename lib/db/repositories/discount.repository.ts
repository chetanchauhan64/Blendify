// ============================================================
// BLENDIFY — Discount Engine Repository
// ============================================================
import { DiscountRule, Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResult } from './base.repository';

export class DiscountRepository extends BaseRepository {
  async findAll(filters: {
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    isActive?: boolean;
    discountType?: string;
  }): Promise<PaginatedResult<DiscountRule>> {
    const { page = 1, limit = 25, sortOrder = 'desc', search, isActive, discountType } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.DiscountRuleWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(discountType ? { discountType: discountType as Prisma.EnumCouponTypeFilter } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.discountRule.findMany({ where, orderBy: { priority: sortOrder }, skip, take }),
      this.db.discountRule.count({ where }),
    ]);

    const mapped = data.map((d) => ({
      ...d,
      discountValue: Number(d.discountValue),
      triggerValue: d.triggerValue ? Number(d.triggerValue) : null,
      maxDiscountAmount: d.maxDiscountAmount ? Number(d.maxDiscountAmount) : null,
    }));

    return this.paginate(mapped as unknown as DiscountRule[], total, page, limit);
  }

  async findById(id: string) {
    const d = await this.db.discountRule.findUnique({ where: { id } });
    if (!d) return null;
    return {
      ...d,
      discountValue: Number(d.discountValue),
      triggerValue: d.triggerValue ? Number(d.triggerValue) : null,
      maxDiscountAmount: d.maxDiscountAmount ? Number(d.maxDiscountAmount) : null,
    };
  }

  async create(data: {
    name: string; description?: string; discountType: string; discountValue: number;
    triggerType: string; triggerValue?: number; applicableTo: string; applicableIds: string[];
    customerTiers?: string[]; maxDiscountAmount?: number; isActive?: boolean;
    isStackable?: boolean; priority?: number; startsAt?: Date; endsAt?: Date; createdById?: string;
  }) {
    return this.db.discountRule.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        discountType: data.discountType as Prisma.DiscountRuleCreateInput['discountType'],
        discountValue: data.discountValue,
        triggerType: data.triggerType,
        triggerValue: data.triggerValue ?? null,
        applicableTo: data.applicableTo,
        applicableIds: data.applicableIds,
        customerTiers: data.customerTiers ?? [],
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        isActive: data.isActive ?? true,
        isStackable: data.isStackable ?? false,
        priority: data.priority ?? 0,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        createdById: data.createdById ?? null,
      },
    });
  }

  async update(id: string, data: Prisma.DiscountRuleUpdateInput) {
    return this.db.discountRule.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.db.discountRule.delete({ where: { id } });
  }

  async findActive() {
    const now = new Date();
    return this.db.discountRule.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { priority: 'desc' },
    });
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.db.discountRule.update({ where: { id }, data: { isActive } });
  }

  async incrementUsage(id: string) {
    return this.db.discountRule.update({ where: { id }, data: { usageCount: { increment: 1 } } });
  }
}

export const discountRepository = new DiscountRepository();
