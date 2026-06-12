// ============================================================
// BLENDIFY — Newsletter Service
// ============================================================
import { newsletterRepository } from '@/lib/db/repositories';
import { NewsletterSubscribeSchema } from '@/lib/validations/schemas';
import type { NewsletterSubscribeInput } from '@/lib/validations/schemas';

export class NewsletterService {
  async subscribe(rawData: NewsletterSubscribeInput) {
    const data = NewsletterSubscribeSchema.parse(rawData);
    const existing = await newsletterRepository.findByEmail(data.email);

    if (existing?.isActive) {
      return { status: 'already_subscribed' as const, subscriber: existing };
    }

    const subscriber = await newsletterRepository.subscribe(data);
    return { status: 'subscribed' as const, subscriber };
  }

  async unsubscribe(email: string) {
    const existing = await newsletterRepository.findByEmail(email);
    if (!existing) return { status: 'not_found' as const };
    if (!existing.isActive) return { status: 'already_unsubscribed' as const };

    await newsletterRepository.unsubscribe(email);
    return { status: 'unsubscribed' as const };
  }

  async getStats() {
    return newsletterRepository.getStats();
  }

  async getSubscribers(
    pagination?: { page?: number; limit?: number },
    tags?: string[],
  ) {
    return newsletterRepository.findActiveSubscribers(pagination, tags);
  }
}

export const newsletterService = new NewsletterService();
