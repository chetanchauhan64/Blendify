// ============================================================
// BLENDIFY — Automation Rules API
// GET  /api/admin/automation/rules — Paginated, searchable rules
// POST /api/admin/automation/rules — Create new rule with AuditLog
// ============================================================
import { NextRequest } from 'next/server';
import { requireAdminAccess } from '@/lib/admin-guard';
import { prisma } from '@/lib/db/prisma';
import { ok, created, badRequest, serverError } from '@/lib/utils/api';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  status: z.enum(['ALL', 'ACTIVE', 'DISABLED']).default('ALL'),
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
  actionType: z.enum([
    'ALL',
    'SEND_EMAIL',
    'CREATE_NOTIFICATION',
    'UPDATE_RECORD',
    'CREATE_AUDIT_LOG',
    'TRIGGER_WORKFLOW',
  ]).default('ALL'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'lastRunAt', 'totalRuns']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const CreateRuleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  triggerType: z.enum([
    'ORDER_CREATED',
    'ORDER_PAID',
    'ORDER_CANCELLED',
    'PAYMENT_FAILED',
    'RETURN_REQUESTED',
    'RETURN_RESOLVED',
    'CUSTOMER_CREATED',
    'REVIEW_SUBMITTED',
    'SCHEDULED',
  ]),
  triggerConfig: z.record(z.string(), z.unknown()).optional().default({}),
  actionType: z.enum([
    'SEND_EMAIL',
    'CREATE_NOTIFICATION',
    'UPDATE_RECORD',
    'CREATE_AUDIT_LOG',
    'TRIGGER_WORKFLOW',
  ]),
  actionConfig: z.record(z.string(), z.unknown()).optional().default({}),
  conditions: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  isActive: z.boolean().default(true),
  schedule: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminAccess();

    const raw = Object.fromEntries(new URL(req.url).searchParams.entries());
    const parseResult = QuerySchema.safeParse(raw);
    if (!parseResult.success) {
      return badRequest('Invalid query parameters', parseResult.error.flatten().fieldErrors);
    }

    const { page, limit, search, status, triggerType, actionType, sortBy, order } = parseResult.data;

    const where: Prisma.AutomationRuleWhereInput = {};

    if (status === 'ACTIVE') where.isActive = true;
    if (status === 'DISABLED') where.isActive = false;
    if (triggerType !== 'ALL') where.triggerType = triggerType;
    if (actionType !== 'ALL') where.actionType = actionType;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, rules] = await Promise.all([
      prisma.automationRule.count({ where }),
      prisma.automationRule.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { executions: true },
          },
        },
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    const data = rules.map((r) => {
      const finished = r.successRuns + r.failureRuns;
      const successRate = finished > 0 ? Math.round((r.successRuns / finished) * 1000) / 10 : 100;

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        triggerType: r.triggerType,
        triggerConfig: r.triggerConfig,
        actionType: r.actionType,
        actionConfig: r.actionConfig,
        conditions: r.conditions,
        isActive: r.isActive,
        schedule: r.schedule,
        lastRunAt: r.lastRunAt,
        nextRunAt: r.nextRunAt,
        totalRuns: r.totalRuns,
        successRuns: r.successRuns,
        failureRuns: r.failureRuns,
        successRate,
        executionCount: r._count.executions,
        createdBy: r.createdBy ? `${r.createdBy.firstName} ${r.createdBy.lastName}` : 'System',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

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
    console.error('[Automation Rules GET]', error);
    return serverError('Failed to load automation rules');
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAccess();

    const body = await req.json();
    const parseResult = CreateRuleSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest('Validation failed', parseResult.error.flatten().fieldErrors);
    }

    const { name, description, triggerType, triggerConfig, actionType, actionConfig, conditions, isActive, schedule } = parseResult.data;

    const rule = await prisma.automationRule.create({
      data: {
        name,
        description: description || null,
        triggerType,
        triggerConfig: triggerConfig ? JSON.parse(JSON.stringify(triggerConfig)) : {},
        actionType,
        actionConfig: actionConfig ? JSON.parse(JSON.stringify(actionConfig)) : {},
        conditions: conditions ? JSON.parse(JSON.stringify(conditions)) : [],
        isActive,
        schedule: schedule || null,
        createdById: admin.id,
      },
    });

    // Create AuditLog entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: admin.id,
          userEmail: admin.email,
          action: 'CREATE',
          module: 'automation',
          entityId: rule.id,
          entityLabel: `Rule: ${rule.name}`,
          after: {
            name: rule.name,
            triggerType: rule.triggerType,
            actionType: rule.actionType,
            isActive: rule.isActive,
          },
          ip: req.headers.get('x-forwarded-for') ?? '',
          userAgent: req.headers.get('user-agent') ?? '',
        },
      });
    } catch {
      // Non-critical
    }

    return created(rule);
  } catch (error) {
    if (error instanceof Error && (error.message.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[Automation Rules POST]', error);
    return serverError('Failed to create automation rule');
  }
}
