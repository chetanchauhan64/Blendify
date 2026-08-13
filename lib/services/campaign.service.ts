// ============================================================
// BLENDIFY — Campaign Service (Email + Push)
// Email sending via Resend. Guarded by RESEND_API_KEY env var.
// ============================================================
import { campaignRepository, newsletterRepository } from '@/lib/db/repositories';
import {
  CreateEmailCampaignSchema,
  UpdateEmailCampaignSchema,
  CreatePushNotificationSchema,
  CampaignFiltersSchema,
  PushFiltersSchema,
} from '@/lib/validations/admin.schemas';

const isResendConfigured =
  !!process.env.RESEND_API_KEY &&
  !process.env.RESEND_API_KEY.startsWith('REPLACE');

export class CampaignService {
  // ── Email Campaigns ───────────────────────────────────────
  async listCampaigns(rawFilters: unknown) {
    const filters = CampaignFiltersSchema.parse(rawFilters);
    return campaignRepository.findAllCampaigns(filters);
  }

  async getCampaign(id: string) {
    const campaign = await campaignRepository.findCampaignById(id);
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  async createCampaign(rawData: unknown, createdById: string) {
    const data = CreateEmailCampaignSchema.parse(rawData);
    return campaignRepository.createCampaign({ ...data, createdById });
  }

  async updateCampaign(id: string, rawData: unknown, updatedById: string) {
    const data = UpdateEmailCampaignSchema.parse(rawData);
    const existing = await campaignRepository.findCampaignById(id);
    if (!existing) throw new Error('Campaign not found');
    if (['SENDING', 'SENT'].includes(existing.status)) {
      throw new Error('Cannot edit a campaign that is already sending or sent');
    }
    return campaignRepository.updateCampaign(id, { ...data, updatedById });
  }

  async deleteCampaign(id: string) {
    const existing = await campaignRepository.findCampaignById(id);
    if (!existing) throw new Error('Campaign not found');
    if (existing.status === 'SENDING') {
      throw new Error('Cannot delete a campaign that is currently sending');
    }
    await campaignRepository.deleteCampaign(id);
  }

  async sendCampaign(id: string) {
    const campaign = await campaignRepository.findCampaignById(id);
    if (!campaign) throw new Error('Campaign not found');
    if (!['DRAFT', 'SCHEDULED'].includes(campaign.status)) {
      throw new Error(`Campaign cannot be sent (current status: ${campaign.status})`);
    }

    await campaignRepository.markCampaignSending(id);

    // Fetch target subscribers
    const { data: subscribers } = await newsletterRepository.findActiveSubscribers(
      { page: 1, limit: 10000 },
      campaign.targetType === 'TAG' ? campaign.targetTags : undefined,
    );

    if (!isResendConfigured) {
      // Simulate send without actually sending
      await campaignRepository.markCampaignSent(id, subscribers.length, 0);
      return { sent: subscribers.length, simulated: true };
    }

    // ── Send via Resend ──────────────────────────────────────
    let sentCount = 0;
    let failedCount = 0;

    // Send in batches of 100 (Resend batch limit)
    const BATCH_SIZE = 100;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      try {
        const payload = batch.map((sub) => ({
          from: process.env.RESEND_FROM_EMAIL ?? 'hello@blendify.in',
          to: [sub.email],
          subject: campaign.subject,
          html: campaign.htmlBody,
          ...(campaign.textBody ? { text: campaign.textBody } : {}),
        }));

        const response = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          sentCount += batch.length;
        } else {
          failedCount += batch.length;
        }
      } catch {
        failedCount += batch.length;
      }
    }

    if (failedCount === subscribers.length && subscribers.length > 0) {
      await campaignRepository.markCampaignFailed(id, failedCount);
      throw new Error('Campaign sending failed for all recipients');
    }

    await campaignRepository.markCampaignSent(id, sentCount, failedCount);
    return { sent: sentCount, failed: failedCount, simulated: false };
  }

  async getCampaignAnalytics() {
    return campaignRepository.getCampaignAnalytics();
  }

  // ── Push Notifications ─────────────────────────────────────
  async listPush(rawFilters: unknown) {
    const filters = PushFiltersSchema.parse(rawFilters);
    return campaignRepository.findAllPush(filters);
  }

  async createPush(rawData: unknown, createdById: string) {
    const data = CreatePushNotificationSchema.parse(rawData);
    const record = await campaignRepository.createPush({ ...data, createdById });
    // Push delivery implementation: integrate with web push API in Phase 4
    // For now, mark as sent immediately (stub)
    await campaignRepository.markPushSent(record.id, 0);
    return record;
  }
}

export const campaignService = new CampaignService();
