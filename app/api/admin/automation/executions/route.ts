// ============================================================
// BLENDIFY — Automation Execution History API
// GET /api/admin/automation/executions
//
// Returns paginated execution history with server-side filters.
// Never exposes sensitive keys, tokens, or credentials.
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, badRequest, serverError } from '@/lib/utils/api';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  ruleId: z.string().optional(),
  status: z.enum(['ALL', 'PENDING', 'RUNNING', 'SUCCESS', 'FAILED']).default('ALL'),
  triggerType: z.enum([
    'ALL',
    'ORDER_CREATED',
    'ORDER_PAID',
    'ORDER_CANCELLED',
    'PAYMENT_FAILED',
    'RETURN_REQUESTED',
    'RETURN_RESOLVED',
    'CUSTOMER_CREATED',
    'REVIEW_SUBMITTED',
    'SCHEDULED',
  ]).default('ALL'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'startedAt', 'completedAt', 'durationMs', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { page, limit, search, ruleId, status, triggerType, dateFrom, dateTo, sortBy, order } = parseResult.data;

    const where: Prisma.AutomationExecutionWhereInput = {};

    if (ruleId && ruleId !== 'ALL') where.ruleId = ruleId;
    if (status !== 'ALL') where.status = status;
    if (triggerType !== 'ALL') where.triggerType = triggerType;

    if (dateFrom) {
      where.createdAt = { ...(where.createdAt as Prisma.DateTimeFilter || {}), gte: new Date(dateFrom) };
    }
    if (dateTo) {
      const existing = (where.createdAt as Prisma.DateTimeFilter) || {};
      where.createdAt = { ...existing, lte: new Date(new Date(dateTo).getTime() + 86400000) };
    }

    if (search) {
      where.OR = [
        { rule: { name: { contains: search, mode: 'insensitive' } } },
        { error: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, executions] = await Promise.all([
      prisma.automationExecution.count({ where }),
      prisma.automationExecution.findMany({
        where,
        include: {
          rule: { select: { id: true, name: true, actionType: true } },
          executedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const data = executions.map((e) => ({
      id: e.id,
      ruleId: e.ruleId,
      ruleName: e.rule.name,
      actionType: e.rule.actionType,
      triggerType: e.triggerType,
      status: e.status,
      startedAt: e.startedAt,
      completedAt: e.completedAt,
      durationMs: e.durationMs,
      result: e.result,
      error: e.error,
      executedBy: e.executedBy ? `${e.executedBy.firstName} ${e.executedBy.lastName}` : 'System / Auto',
      createdAt: e.createdAt,
    }));

    return ok(data, {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[Automation Executions GET]', error);
    return serverError('Failed to load automation executions');
  }
}
