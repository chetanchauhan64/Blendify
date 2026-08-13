// ============================================================
// BLENDIFY — Referral Service
// ============================================================
import { referralRepository } from '@/lib/db/repositories';
import { ReferralConfigSchema } from '@/lib/validations/admin.schemas';

export class ReferralService {
  async getConfig() {
    return referralRepository.getConfig();
  }

  async updateConfig(rawData: unknown, updatedById: string) {
    const data = ReferralConfigSchema.parse(rawData);
    return referralRepository.upsertConfig({ ...data, updatedById });
  }

  async getLeaderboard(limit = 20) {
    return referralRepository.getLeaderboard(limit);
  }

  async getStats() {
    return referralRepository.getStats();
  }

  async getAnalytics() {
    return referralRepository.getAnalytics();
  }
}

export const referralService = new ReferralService();
