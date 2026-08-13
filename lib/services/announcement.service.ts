// ============================================================
// BLENDIFY — Announcement Service
// ============================================================
import { announcementRepository } from '@/lib/db/repositories';
import { z } from 'zod';
import { CreateAnnouncementBarSchema, UpdateAnnouncementBarSchema, PaginationSchema } from '@/lib/validations/admin.schemas';

export class AnnouncementService {
  async list(rawFilters: unknown) {
    const filters = PaginationSchema.extend({ isActive: z.coerce.boolean().optional() }).parse(rawFilters);
    return announcementRepository.findAll(filters);
  }

  async getById(id: string) {
    const bar = await announcementRepository.findById(id);
    if (!bar) throw new Error('Announcement bar not found');
    return bar;
  }

  async create(rawData: unknown, createdById: string) {
    const data = CreateAnnouncementBarSchema.parse(rawData);
    return announcementRepository.create({ ...data, createdById });
  }

  async update(id: string, rawData: unknown, updatedById: string) {
    const data = UpdateAnnouncementBarSchema.parse(rawData);
    const existing = await announcementRepository.findById(id);
    if (!existing) throw new Error('Announcement bar not found');
    return announcementRepository.update(id, { ...data, updatedById });
  }

  async delete(id: string) {
    await announcementRepository.delete(id);
  }

  async reorder(ids: string[]) {
    return announcementRepository.reorder(ids);
  }

  async getActive() {
    return announcementRepository.findActive();
  }
}

export const announcementService = new AnnouncementService();
