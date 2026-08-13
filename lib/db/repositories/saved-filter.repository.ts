// ============================================================
// BLENDIFY — Saved Filter Repository
// ============================================================
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class SavedFilterRepository extends BaseRepository {
  async findByUserAndModule(userId: string, module: string) {
    return this.db.savedFilter.findMany({
      where: { userId, module },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(data: {
    userId: string;
    module: string;
    name: string;
    filters: Record<string, unknown>;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      // Unset any existing defaults for this user+module
      await this.db.savedFilter.updateMany({
        where: { userId: data.userId, module: data.module, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.db.savedFilter.create({
      data: {
        userId: data.userId,
        module: data.module,
        name: data.name,
        filters: data.filters as unknown as Prisma.InputJsonValue,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async update(id: string, userId: string, data: {
    name?: string;
    filters?: Record<string, unknown>;
    isDefault?: boolean;
  }) {
    const existing = await this.db.savedFilter.findFirst({ where: { id, userId } });
    if (!existing) throw new Error('Saved filter not found');

    if (data.isDefault) {
      await this.db.savedFilter.updateMany({
        where: { userId, module: existing.module, isDefault: true },
        data: { isDefault: false },
      });
    }

    const { filters, ...rest } = data;
    return this.db.savedFilter.update({
      where: { id },
      data: {
        ...rest,
        ...(filters ? { filters: filters as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.db.savedFilter.deleteMany({ where: { id, userId } });
  }
}

export const savedFilterRepository = new SavedFilterRepository();
