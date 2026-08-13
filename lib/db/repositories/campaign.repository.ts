// ============================================================
// BLENDIFY — Campaign Repository (Email + Push)
// ============================================================
import { Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResult } from './base.repository';
import type { CampaignFiltersSchema, PushFiltersSchema } from '@/lib/validations/admin.schemas';
import type { z } from 'zod';

type CampaignFiltersInput = z.infer<typeof CampaignFiltersSchema>;
type PushFiltersInput = z.infer<typeof PushFiltersSchema>;

export class CampaignRepository extends BaseRepository {
  // ── Email Campaigns ─────────────────────────────────────
  async findAllCampaigns(filters: CampaignFiltersInput): Promise<PaginatedResult<{
    id: string; name: string; subject: string; targetType: string; targetTags: string[];
    status: string; scheduledAt: Date | null; sentAt: Date | null; sentCount: number;
    openCount: number; clickCount: number; failedCount: number; createdAt: Date; updatedAt: Date;
  }>> {
    const { page = 1, limit = 25, sortOrder = 'desc', search, status, targetType, dateFrom, dateTo } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.EmailCampaignWhereInput = {
      ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { subject: { contains: search, mode: 'insensitive' } }] } : {}),
      ...(status && { status }),
      ...(targetType && { targetType }),
      ...(dateFrom || dateTo ? { createdAt: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {}),
    };

    const [data, total] = await Promise.all([
      this.db.emailCampaign.findMany({ where, orderBy: { createdAt: sortOrder }, skip, take }),
      this.db.emailCampaign.count({ where }),
    ]);

    return this.paginate(data, total, page, limit);
  }

  async findCampaignById(id: string) {
    return this.db.emailCampaign.findUnique({ where: { id } });
  }

  async createCampaign(data: {
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    targetType: string;
    targetTags: string[];
    scheduledAt?: Date;
    createdById?: string;
  }) {
    return this.db.emailCampaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        htmlBody: data.htmlBody,
        textBody: data.textBody ?? null,
        targetType: data.targetType,
        targetTags: data.targetTags,
        scheduledAt: data.scheduledAt ?? null,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        createdById: data.createdById ?? null,
      },
    });
  }

  async updateCampaign(id: string, data: Partial<{
    name: string; subject: string; htmlBody: string; textBody: string;
    targetType: string; targetTags: string[]; scheduledAt: Date | null; status: string; updatedById: string;
  }>) {
    return this.db.emailCampaign.update({ where: { id }, data });
  }

  async markCampaignSending(id: string) {
    return this.db.emailCampaign.update({ where: { id }, data: { status: 'SENDING' } });
  }

  async markCampaignSent(id: string, sentCount: number, failedCount = 0) {
    return this.db.emailCampaign.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), sentCount, failedCount },
    });
  }

  async markCampaignFailed(id: string, failedCount: number) {
    return this.db.emailCampaign.update({ where: { id }, data: { status: 'FAILED', failedCount } });
  }

  async deleteCampaign(id: string) {
    await this.db.emailCampaign.delete({ where: { id } });
  }

  async getCampaignAnalytics() {
    const [total, draft, scheduled, sent, failed, totalSent, totalOpen, totalClick] = await Promise.all([
      this.db.emailCampaign.count(),
      this.db.emailCampaign.count({ where: { status: 'DRAFT' } }),
      this.db.emailCampaign.count({ where: { status: 'SCHEDULED' } }),
      this.db.emailCampaign.count({ where: { status: 'SENT' } }),
      this.db.emailCampaign.count({ where: { status: 'FAILED' } }),
      this.db.emailCampaign.aggregate({ _sum: { sentCount: true }, where: { status: 'SENT' } }),
      this.db.emailCampaign.aggregate({ _sum: { openCount: true }, where: { status: 'SENT' } }),
      this.db.emailCampaign.aggregate({ _sum: { clickCount: true }, where: { status: 'SENT' } }),
    ]);

    const totalSentCount = totalSent._sum.sentCount ?? 0;
    const totalOpenCount = totalOpen._sum.openCount ?? 0;
    const totalClickCount = totalClick._sum.clickCount ?? 0;

    return {
      total, draft, scheduled, sent, failed,
      totalEmailsSent: totalSentCount,
      avgOpenRate: totalSentCount > 0 ? (totalOpenCount / totalSentCount) * 100 : 0,
      avgClickRate: totalSentCount > 0 ? (totalClickCount / totalSentCount) * 100 : 0,
    };
  }

  // ── Push Notifications ───────────────────────────────────
  async findAllPush(filters: PushFiltersInput): Promise<PaginatedResult<{
    id: string; title: string; body: string; targetType: string;
    status: string; sentCount: number; sentAt: Date | null; createdAt: Date;
  }>> {
    const { page = 1, limit = 25, sortOrder = 'desc', search, status } = filters;
    const { skip, take } = this.getPaginationOffset(page, limit);

    const where: Prisma.PushNotificationRecordWhereInput = {
      ...(search ? { OR: [{ title: { contains: search, mode: 'insensitive' } }, { body: { contains: search, mode: 'insensitive' } }] } : {}),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.db.pushNotificationRecord.findMany({ where, orderBy: { createdAt: sortOrder }, skip, take }),
      this.db.pushNotificationRecord.count({ where }),
    ]);

    return this.paginate(data, total, page, limit);
  }

  async createPush(data: {
    title: string; body: string; icon?: string; imageUrl?: string;
    actionUrl?: string; targetType: string; scheduledAt?: Date; createdById?: string;
  }) {
    return this.db.pushNotificationRecord.create({
      data: {
        title: data.title,
        body: data.body,
        icon: data.icon ?? null,
        imageUrl: data.imageUrl ?? null,
        actionUrl: data.actionUrl ?? null,
        targetType: data.targetType,
        scheduledAt: data.scheduledAt ?? null,
        status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
        createdById: data.createdById ?? null,
      },
    });
  }

  async markPushSent(id: string, sentCount: number) {
    return this.db.pushNotificationRecord.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), sentCount },
    });
  }
}

export const campaignRepository = new CampaignRepository();
