// ============================================================
// BLENDIFY — Support Overview API
// GET /api/admin/support/overview
//
// Returns KPIs, time series, and breakdowns for the support dashboard.
// Uses PostgreSQL aggregations via Prisma.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError, badRequest } from '@/lib/utils/api';
import { z } from 'zod';

const QuerySchema = z.object({
  period: z.enum(['today', 'yesterday', 'last7', 'last30', 'last90', 'thisMonth', 'prevMonth', 'thisYear', 'custom']).default('last30'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

function getPeriodDates(period: string, dateFrom?: string, dateTo?: string): { from: Date; to: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  switch (period) {
    case 'today': return { from: today, to: tomorrow };
    case 'yesterday': return { from: new Date(today.getTime() - 86400000), to: today };
    case 'last7': return { from: new Date(today.getTime() - 6 * 86400000), to: tomorrow };
    case 'last30': return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
    case 'last90': return { from: new Date(today.getTime() - 89 * 86400000), to: tomorrow };
    case 'thisMonth': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
    case 'prevMonth': return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
    case 'thisYear': return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1) };
    case 'custom': {
      if (!dateFrom || !dateTo) return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
      return { from: new Date(dateFrom), to: new Date(new Date(dateTo).getTime() + 86400000) };
    }
    default: return { from: new Date(today.getTime() - 29 * 86400000), to: tomorrow };
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { period, dateFrom, dateTo } = parseResult.data;
    const { from, to } = getPeriodDates(period, dateFrom, dateTo);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart.getTime() + 86400000);
    const weekStart = new Date(todayStart.getTime() - 6 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── KPIs ──────────────────────────────────────────────────
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      waitingTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      todayTickets,
      weekTickets,
      monthTickets,
      resolvedWithTime,
      respondedWithTime,
    ] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'WAITING_FOR_CUSTOMER' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
      prisma.supportTicket.count({ where: { priority: 'URGENT', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.supportTicket.count({ where: { createdAt: { gte: todayStart, lt: tomorrowStart } } }),
      prisma.supportTicket.count({ where: { createdAt: { gte: weekStart, lt: tomorrowStart } } }),
      prisma.supportTicket.count({ where: { createdAt: { gte: monthStart, lt: tomorrowStart } } }),
      prisma.supportTicket.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        take: 1000,
        orderBy: { resolvedAt: 'desc' },
      }),
      prisma.supportTicket.findMany({
        where: { firstResponseAt: { not: null } },
        select: { createdAt: true, firstResponseAt: true },
        take: 1000,
        orderBy: { firstResponseAt: 'desc' },
      }),
    ]);

    // Avg resolution time (hours)
    let averageResolutionTime = 0;
    if (resolvedWithTime.length > 0) {
      const totalMs = resolvedWithTime.reduce((sum, t) => {
        return sum + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime());
      }, 0);
      averageResolutionTime = Math.round((totalMs / resolvedWithTime.length) / 3600000 * 10) / 10;
    }

    // Avg first response time (hours)
    let averageFirstResponseTime = 0;
    if (respondedWithTime.length > 0) {
      const totalMs = respondedWithTime.reduce((sum, t) => {
        return sum + (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime());
      }, 0);
      averageFirstResponseTime = Math.round((totalMs / respondedWithTime.length) / 3600000 * 10) / 10;
    }

    // ── Time Series ───────────────────────────────────────────
    const periodTickets = await prisma.supportTicket.findMany({
      where: { createdAt: { gte: from, lt: to } },
      select: { createdAt: true, resolvedAt: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    const dayMap = new Map<string, { created: number; resolved: number }>();
    const cursor = new Date(from);
    while (cursor < to) {
      const key = cursor.toISOString().slice(0, 10);
      dayMap.set(key, { created: 0, resolved: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const t of periodTickets) {
      const createdKey = new Date(t.createdAt).toISOString().slice(0, 10);
      if (dayMap.has(createdKey)) {
        dayMap.get(createdKey)!.created++;
      }
      if (t.resolvedAt) {
        const resolvedKey = new Date(t.resolvedAt).toISOString().slice(0, 10);
        if (dayMap.has(resolvedKey)) {
          dayMap.get(resolvedKey)!.resolved++;
        }
      }
    }

    const timeSeries = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      created: data.created,
      resolved: data.resolved,
    }));

    // ── Breakdowns ────────────────────────────────────────────
    const [statusBreakdown, priorityBreakdown, categoryBreakdown, assignedStaffRaw] = await Promise.all([
      prisma.supportTicket.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.supportTicket.groupBy({ by: ['priority'], _count: { id: true } }),
      prisma.supportTicket.groupBy({ by: ['category'], _count: { id: true } }),
      prisma.supportTicket.groupBy({
        by: ['assignedToId'],
        _count: { id: true },
        where: { assignedToId: { not: null } },
      }),
    ]);

    // Resolve staff names
    const staffIds = assignedStaffRaw.map(s => s.assignedToId).filter(Boolean) as string[];
    const staffUsers = staffIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const staffMap = new Map(staffUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

    const assignedStaffBreakdown = assignedStaffRaw.map(s => ({
      label: staffMap.get(s.assignedToId!) || 'Unknown',
      value: s._count.id,
    }));

    return ok({
      kpis: {
        totalTickets,
        openTickets,
        inProgressTickets,
        waitingForCustomerTickets: waitingTickets,
        resolvedTickets,
        closedTickets,
        urgentTickets,
        averageResolutionTime,
        averageFirstResponseTime,
        todayTickets,
        weekTickets,
        monthTickets,
      },
      timeSeries,
      statusBreakdown: statusBreakdown.map(s => ({ label: s.status, value: s._count.id })),
      priorityBreakdown: priorityBreakdown.map(p => ({ label: p.priority, value: p._count.id })),
      categoryBreakdown: categoryBreakdown.map(c => ({ label: c.category, value: c._count.id })),
      assignedStaffBreakdown,
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) throw error;
    console.error('[Support Overview]', error);
    return serverError('Failed to load support overview');
  }
}
