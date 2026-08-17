// ============================================================
// BLENDIFY — Automation Overview API
// GET /api/admin/automation/overview
//
// Returns real PostgreSQL metrics, time series, and breakdowns
// for the Automation & Workflow Engine dashboard.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, serverError } from '@/lib/utils/api';

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 6 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ── Aggregations via Promise.all ──────────────────────────
    const [
      totalRules,
      activeRules,
      disabledRules,
      totalExecutions,
      executionsToday,
      executionsThisWeek,
      executionsThisMonth,
      successfulExecutions,
      failedExecutions,
      runningExecutions,
      recentExecutions,
      upcomingRules,
      triggerTypeBreakdown,
      actionTypeBreakdown,
      executionStatusBreakdown,
    ] = await Promise.all([
      prisma.automationRule.count(),
      prisma.automationRule.count({ where: { isActive: true } }),
      prisma.automationRule.count({ where: { isActive: false } }),
      prisma.automationExecution.count(),
      prisma.automationExecution.count({ where: { startedAt: { gte: todayStart } } }),
      prisma.automationExecution.count({ where: { startedAt: { gte: weekStart } } }),
      prisma.automationExecution.count({ where: { startedAt: { gte: monthStart } } }),
      prisma.automationExecution.count({ where: { status: 'SUCCESS' } }),
      prisma.automationExecution.count({ where: { status: 'FAILED' } }),
      prisma.automationExecution.count({ where: { status: 'RUNNING' } }),
      prisma.automationExecution.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          rule: { select: { name: true } },
          executedBy: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.automationRule.findMany({
        where: { isActive: true, triggerType: 'SCHEDULED' },
        take: 5,
        orderBy: { nextRunAt: 'asc' },
        select: {
          id: true,
          name: true,
          schedule: true,
          lastRunAt: true,
          nextRunAt: true,
          actionType: true,
        },
      }),
      prisma.automationRule.groupBy({
        by: ['triggerType'],
        _count: { id: true },
      }),
      prisma.automationRule.groupBy({
        by: ['actionType'],
        _count: { id: true },
      }),
      prisma.automationExecution.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    // ── Rates ─────────────────────────────────────────────────
    const finishedCount = successfulExecutions + failedExecutions;
    const successRate = finishedCount > 0 ? Math.round((successfulExecutions / finishedCount) * 1000) / 10 : 100;
    const failureRate = finishedCount > 0 ? Math.round((failedExecutions / finishedCount) * 1000) / 10 : 0;

    // ── Time Series (Last 14 Days) ────────────────────────────
    const fourteenDaysAgo = new Date(todayStart.getTime() - 13 * 86400000);
    const timeSeriesExecutions = await prisma.automationExecution.findMany({
      where: { startedAt: { gte: fourteenDaysAgo } },
      select: { startedAt: true, status: true },
      orderBy: { startedAt: 'asc' },
    });

    const dayMap = new Map<string, { success: number; failed: number }>();
    const cursor = new Date(fourteenDaysAgo);
    while (cursor <= now) {
      dayMap.set(cursor.toISOString().slice(0, 10), { success: 0, failed: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const exec of timeSeriesExecutions) {
      if (exec.startedAt) {
        const key = exec.startedAt.toISOString().slice(0, 10);
        if (dayMap.has(key)) {
          const entry = dayMap.get(key)!;
          if (exec.status === 'SUCCESS') entry.success++;
          if (exec.status === 'FAILED') entry.failed++;
        }
      }
    }

    const timeSeries = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      success: data.success,
      failed: data.failed,
      total: data.success + data.failed,
    }));

    return ok({
      kpis: {
        totalRules,
        activeRules,
        disabledRules,
        totalExecutions,
        executionsToday,
        executionsThisWeek,
        executionsThisMonth,
        successfulExecutions,
        failedExecutions,
        runningExecutions,
        successRate,
        failureRate,
      },
      timeSeries,
      recentExecutions: recentExecutions.map((e) => ({
        id: e.id,
        ruleId: e.ruleId,
        ruleName: e.rule.name,
        triggerType: e.triggerType,
        status: e.status,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
        durationMs: e.durationMs,
        result: e.result,
        error: e.error,
        executedBy: e.executedBy ? `${e.executedBy.firstName} ${e.executedBy.lastName}` : 'System / Auto',
      })),
      upcomingRules,
      triggerTypeBreakdown: triggerTypeBreakdown.map((t) => ({ label: t.triggerType, value: t._count.id })),
      actionTypeBreakdown: actionTypeBreakdown.map((a) => ({ label: a.actionType, value: a._count.id })),
      executionStatusBreakdown: executionStatusBreakdown.map((s) => ({ label: s.status, value: s._count.id })),
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[Automation Overview API]', error);
    return serverError('Failed to load automation overview');
  }
}
