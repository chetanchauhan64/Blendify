// ============================================================
// BLENDIFY — Announcement Bar Repository
// ============================================================
import { AnnouncementBar, Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResult } from './base.repository';
import type { PaginationInput } from '@/lib/validations/admin.schemas';

export class AnnouncementRepository extends BaseRepository {
  async findAll(filters: PaginationInput & { isActive?: boolean }): Promise<PaginatedResult<{
    id: string; message: string; backgroundColor: string; textColor: string;
    linkText: string | null; linkUrl: string | null; isActive: boolean;
    startsAt: Date | null; endsAt: Date | null; sortOrder: number;
    targetPages: string[]; createdAt: Date; updatedAt: Date;
  }>> {
    const { page = 1, limit = 25, sortOrder = 'asc', search, isActive } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.AnnouncementBarWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(search ? { message: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.announcementBar.findMany({ where, orderBy: { sortOrder: sortOrder as 'asc' | 'desc' }, skip, take }),
      this.db.announcementBar.count({ where }),
    ]);

    return this.paginate<AnnouncementBar>(data, total, page, limit);
  }

  async findById(id: string) {
    return this.db.announcementBar.findUnique({ where: { id } });
  }

  async findActive() {
    const now = new Date();
    return this.db.announcementBar.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(data: {
    message: string; backgroundColor: string; textColor: string;
    linkText?: string; linkUrl?: string; isActive: boolean;
    startsAt?: Date; endsAt?: Date; sortOrder: number;
    targetPages: string[]; createdById?: string;
  }) {
    return this.db.announcementBar.create({
      data: {
        message: data.message,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        linkText: data.linkText ?? null,
        linkUrl: data.linkUrl ?? null,
        isActive: data.isActive,
        startsAt: data.startsAt ?? null,
        endsAt: data.endsAt ?? null,
        sortOrder: data.sortOrder,
        targetPages: data.targetPages,
        createdById: data.createdById ?? null,
      },
    });
  }

  async update(id: string, data: Partial<{
    message: string; backgroundColor: string; textColor: string;
    linkText: string | null; linkUrl: string | null; isActive: boolean;
    startsAt: Date | null; endsAt: Date | null; sortOrder: number;
    targetPages: string[]; updatedById: string;
  }>) {
    return this.db.announcementBar.update({ where: { id }, data });
  }

  async delete(id: string) {
    await this.db.announcementBar.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    const updates = ids.map((id, index) =>
      this.db.announcementBar.update({ where: { id }, data: { sortOrder: index } })
    );
    return this.db.$transaction(updates);
  }
}

export const announcementRepository = new AnnouncementRepository();
