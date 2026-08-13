// ============================================================
// BLENDIFY — Banner Service
// ============================================================
import { bannerRepository } from '@/lib/db/repositories';
import { CreateHomepageBannerSchema, UpdateHomepageBannerSchema, BannerFiltersSchema } from '@/lib/validations/admin.schemas';

export class BannerService {
  async list(rawFilters: unknown) {
    const filters = BannerFiltersSchema.parse(rawFilters);
    return bannerRepository.findAll(filters);
  }

  async getById(id: string) {
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new Error('Banner not found');
    return banner;
  }

  async create(rawData: unknown, createdById: string) {
    const data = CreateHomepageBannerSchema.parse(rawData);
    return bannerRepository.create({ ...data, createdById });
  }

  async update(id: string, rawData: unknown, updatedById: string) {
    const data = UpdateHomepageBannerSchema.parse(rawData);
    const existing = await bannerRepository.findById(id);
    if (!existing) throw new Error('Banner not found');
    return bannerRepository.update(id, {
      title: data.title ?? existing.title,
      subtitle: data.subtitle,
      description: data.description,
      imageUrl: data.imageUrl ?? existing.imageUrl,
      mobileImageUrl: data.mobileImageUrl,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      badge: data.badge,
      textPosition: data.textPosition ?? existing.textPosition,
      textColor: data.textColor ?? existing.textColor,
      overlayOpacity: data.overlayOpacity ?? existing.overlayOpacity,
      isActive: data.isActive ?? existing.isActive,
      sortOrder: data.sortOrder ?? existing.sortOrder,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      updatedById,
    });
  }

  async delete(id: string) {
    await bannerRepository.delete(id);
  }

  async reorder(ids: string[]) {
    return bannerRepository.reorder(ids);
  }

  async toggleActive(id: string, isActive: boolean) {
    return bannerRepository.toggleActive(id, isActive);
  }

  async getActive() {
    return bannerRepository.findActive();
  }
}

export const bannerService = new BannerService();
