// ============================================================
// BLENDIFY — Loyalty Admin Service
// ============================================================
import { loyaltyConfigRepository } from '@/lib/db/repositories';
import {
  LoyaltyConfigSchema,
  ManualPointsAdjustSchema,
  LoyaltyFiltersSchema,
} from '@/lib/validations/admin.schemas';

export class LoyaltyAdminService {
  async getConfig() {
    return loyaltyConfigRepository.findAll();
  }

  async updateConfig(rawData: unknown, updatedById: string) {
    const data = LoyaltyConfigSchema.parse(rawData);
    return loyaltyConfigRepository.upsert({ ...data, updatedById });
  }

  async getTransactions(rawFilters: unknown) {
    const filters = LoyaltyFiltersSchema.parse(rawFilters);
    return loyaltyConfigRepository.getTransactions(filters);
  }

  async manualAdjust(rawData: unknown) {
    const data = ManualPointsAdjustSchema.parse(rawData);
    return loyaltyConfigRepository.manualAdjust(data);
  }

  async getAnalytics() {
    return loyaltyConfigRepository.getAnalytics();
  }
}

export const loyaltyAdminService = new LoyaltyAdminService();
