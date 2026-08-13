// ============================================================
// BLENDIFY — Popup Service
// ============================================================
import { popupRepository } from '@/lib/db/repositories';
import { CreatePopupCampaignSchema, UpdatePopupCampaignSchema, PopupFiltersSchema } from '@/lib/validations/admin.schemas';

export class PopupService {
  async list(rawFilters: unknown) {
    const filters = PopupFiltersSchema.parse(rawFilters);
    return popupRepository.findAll(filters);
  }

  async getById(id: string) {
    const popup = await popupRepository.findById(id);
    if (!popup) throw new Error('Popup campaign not found');
    return popup;
  }

  async create(rawData: unknown, createdById: string) {
    const data = CreatePopupCampaignSchema.parse(rawData);
    return popupRepository.create({ ...data, createdById });
  }

  async update(id: string, rawData: unknown, updatedById: string) {
    const data = UpdatePopupCampaignSchema.parse(rawData);
    const existing = await popupRepository.findById(id);
    if (!existing) throw new Error('Popup campaign not found');
    return popupRepository.update(id, { ...data, updatedById });
  }

  async delete(id: string) {
    await popupRepository.delete(id);
  }

  async getAnalytics() {
    return popupRepository.getAnalytics();
  }
}

export const popupService = new PopupService();
