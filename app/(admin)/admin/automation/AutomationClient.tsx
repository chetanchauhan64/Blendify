// ============================================================
// BLENDIFY — Automation & Workflow Engine Client
// /admin/automation
//
// Features:
//   - Tab 1: Overview (KPI StatCards, Time Series & Breakdowns)
//   - Tab 2: Automations (DataTable, Search, Filters, Enable/Disable, Edit, Run, Delete)
//   - Tab 3: Execution History (DataTable, Status Badges, Execution Details Drawer)
//   - Tab 4: Workflow Builder (Visual Creator for Triggers, Conditions & Safe Actions)
//   - Multi-format Export (CSV, Excel, PDF, Print)
//   - Real PostgreSQL data only — zero mock data
// ============================================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Workflow, Play, Power, AlertTriangle, CheckCircle2,
  Clock, Plus, RefreshCw, Search, X, Eye, FileText,
  Mail, Bell, Database, ShieldCheck, Zap,
  Calendar, Layers, ArrowRight, Trash2, Edit3,
} from 'lucide-react';
import { StatCard } from '@/components/admin/ui/StatCard';
import { BarChart, DonutChart, LineChart } from '@/components/admin/ui/AnalyticsChart';
import { ExportMenu } from '@/components/admin/ui/ExportMenu';
import { SkeletonTable } from '@/components/admin/ui/SkeletonTable';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { StatusBadge } from '@/components/admin/ui/StatusBadge';
import { Drawer } from '@/components/admin/ui/Drawer';
import { adminToast } from '@/components/admin/ui/Toast';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { DataTable, type Column } from '@/components/admin/ui/DataTable';

// ── Constants & Labels ────────────────────────────────────────
const TRIGGER_TYPES = [
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
] as const;

const ACTION_TYPES = [
  'ALL',
  'SEND_EMAIL',
  'CREATE_NOTIFICATION',
  'UPDATE_RECORD',
  'CREATE_AUDIT_LOG',
  'TRIGGER_WORKFLOW',
] as const;

const TRIGGER_LABELS: Record<string, string> = {
  ORDER_CREATED: 'Order Created',
  ORDER_PAID: 'Order Paid',
  ORDER_CANCELLED: 'Order Cancelled',
  PAYMENT_FAILED: 'Payment Failed',
  RETURN_REQUESTED: 'Return Requested',
  RETURN_RESOLVED: 'Return Resolved',
  CUSTOMER_CREATED: 'Customer Created',
  REVIEW_SUBMITTED: 'Review Submitted',
  SCHEDULED: 'Scheduled / Cron',
};

const ACTION_LABELS: Record<string, string> = {
  SEND_EMAIL: 'Send Email (Resend)',
  CREATE_NOTIFICATION: 'Broadcast Notification',
  UPDATE_RECORD: 'Update System Records',
  CREATE_AUDIT_LOG: 'Create Audit Event',
  TRIGGER_WORKFLOW: 'Trigger Internal Workflow',
};

const RECORD_OPERATIONS = [
  { value: 'SYNC_LOYALTY_TIERS', label: 'Synchronize High-Tier Loyalty Points' },
  { value: 'CANCEL_EXPIRED_PENDING_ORDERS', label: 'Cancel Expired Unpaid Orders (>48h)' },
  { value: 'MARK_EXPIRED_COUPONS', label: 'Deactivate Expired Promotional Coupons' },
];

const PREDEFINED_WORKFLOWS = [
  { value: 'DAILY_DIGEST', label: 'Daily Business Summary Digest' },
  { value: 'INVENTORY_HEALTH_CHECK', label: 'Inventory Low-Stock Health Check' },
  { value: 'STALE_CART_CLEANUP', label: 'Cleanup Stale Abandoned Carts (>30d)' },
  { value: 'LOYALTY_TIER_SYNC', label: 'Customer Loyalty Tiers Sync' },
  { value: 'CUSTOMER_RETENTION_CHECK', label: 'Customer Retention Intelligence Check' },
];

// ── Types ─────────────────────────────────────────────────────
interface OverviewData {
  kpis: {
    totalRules: number;
    activeRules: number;
    disabledRules: number;
    totalExecutions: number;
    executionsToday: number;
    executionsThisWeek: number;
    executionsThisMonth: number;
    successfulExecutions: number;
    failedExecutions: number;
    runningExecutions: number;
    successRate: number;
    failureRate: number;
  };
  timeSeries: Array<{ date: string; success: number; failed: number; total: number }>;
  recentExecutions: Array<{
    id: string;
    ruleId: string;
    ruleName: string;
    triggerType: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
    result: Record<string, unknown> | null;
    error: string | null;
    executedBy: string;
  }>;
  upcomingRules: Array<{
    id: string;
    name: string;
    schedule: string | null;
    lastRunAt: string | null;
    nextRunAt: string | null;
    actionType: string;
  }>;
  triggerTypeBreakdown: Array<{ label: string; value: number }>;
  actionTypeBreakdown: Array<{ label: string; value: number }>;
  executionStatusBreakdown: Array<{ label: string; value: number }>;
}

interface AutomationRuleItem {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: Record<string, unknown> | null;
  actionType: string;
  actionConfig: Record<string, unknown> | null;
  conditions: Array<Record<string, unknown>> | null;
  isActive: boolean;
  schedule: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalRuns: number;
  successRuns: number;
  failureRuns: number;
  successRate: number;
  executionCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AutomationExecutionItem {
  id: string;
  ruleId: string;
  ruleName: string;
  actionType: string;
  triggerType: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  result: Record<string, unknown> | null;
  error: string | null;
  executedBy: string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Main Client Component ─────────────────────────────────────
export function AutomationClient() {
  const [tab, setTab] = useState<'overview' | 'rules' | 'history' | 'builder'>('overview');

  // Overview state
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');

  // Rules state
  const [rules, setRules] = useState<AutomationRuleItem[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [rulesError, setRulesError] = useState('');
  const [rulesTotal, setRulesTotal] = useState(0);
  const [rulesPage, setRulesPage] = useState(1);
  const [rulesLimit, setRulesLimit] = useState(25);
  const [rulesSearch, setRulesSearch] = useState('');
  const [rulesStatus, setRulesStatus] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');
  const [rulesTrigger, setRulesTrigger] = useState('ALL');
  const [rulesAction, setRulesAction] = useState('ALL');

  // Executions History state
  const [executions, setExecutions] = useState<AutomationExecutionItem[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(true);
  const [executionsError, setExecutionsError] = useState('');
  const [executionsTotal, setExecutionsTotal] = useState(0);
  const [executionsPage, setExecutionsPage] = useState(1);
  const [executionsLimit, setExecutionsLimit] = useState(25);
  const [executionsSearch, setExecutionsSearch] = useState('');
  const [executionsStatus, setExecutionsStatus] = useState('ALL');
  const [executionsTrigger, setExecutionsTrigger] = useState('ALL');

  // Drawer / Inspection states
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecutionItem | null>(null);
  const [selectedRule, setSelectedRule] = useState<AutomationRuleItem | null>(null);
  const [ruleDrawerOpen, setRuleDrawerOpen] = useState(false);
  const [executionDrawerOpen, setExecutionDrawerOpen] = useState(false);

  // Form Builder state
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderTrigger, setBuilderTrigger] = useState<string>('ORDER_PAID');
  const [builderAction, setBuilderAction] = useState<string>('SEND_EMAIL');
  const [builderSchedule, setBuilderSchedule] = useState('');
  const [builderEmailTo, setBuilderEmailTo] = useState('admin@blendify.in');
  const [builderEmailSubject, setBuilderEmailSubject] = useState('Order Payment Notification');
  const [builderEmailBody, setBuilderEmailBody] = useState('Order has been successfully paid and verified.');
  const [builderNotifTitle, setBuilderNotifTitle] = useState('New System Alert');
  const [builderNotifMessage, setBuilderNotifMessage] = useState('Workflow condition triggered.');
  const [builderRecordOp, setBuilderRecordOp] = useState('SYNC_LOYALTY_TIERS');
  const [builderWorkflow, setBuilderWorkflow] = useState('DAILY_DIGEST');
  const [builderActive, setBuilderActive] = useState(true);
  const [builderSaving, setBuilderSaving] = useState(false);

  // Execution runner state
  const [executingRuleId, setExecutingRuleId] = useState<string | null>(null);

  // ── Load Overview ───────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError('');
    try {
      const res = await fetch('/api/admin/automation/overview');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load overview');
      setOverview(json.data);
    } catch (e) {
      setOverviewError((e as Error).message);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'overview') loadOverview();
  }, [tab, loadOverview]);

  // ── Load Rules ──────────────────────────────────────────────
  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    setRulesError('');
    try {
      const params = new URLSearchParams({
        page: String(rulesPage),
        limit: String(rulesLimit),
        status: rulesStatus,
        triggerType: rulesTrigger,
        actionType: rulesAction,
      });
      if (rulesSearch) params.set('search', rulesSearch);

      const res = await fetch(`/api/admin/automation/rules?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load rules');
      setRules(json.data);
      setRulesTotal(json.pagination?.total ?? 0);
    } catch (e) {
      setRulesError((e as Error).message);
    } finally {
      setRulesLoading(false);
    }
  }, [rulesPage, rulesLimit, rulesStatus, rulesTrigger, rulesAction, rulesSearch]);

  useEffect(() => {
    if (tab === 'rules') loadRules();
  }, [tab, loadRules]);

  // ── Load Executions ─────────────────────────────────────────
  const loadExecutions = useCallback(async () => {
    setExecutionsLoading(true);
    setExecutionsError('');
    try {
      const params = new URLSearchParams({
        page: String(executionsPage),
        limit: String(executionsLimit),
        status: executionsStatus,
        triggerType: executionsTrigger,
      });
      if (executionsSearch) params.set('search', executionsSearch);

      const res = await fetch(`/api/admin/automation/executions?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load executions');
      setExecutions(json.data);
      setExecutionsTotal(json.pagination?.total ?? 0);
    } catch (e) {
      setExecutionsError((e as Error).message);
    } finally {
      setExecutionsLoading(false);
    }
  }, [executionsPage, executionsLimit, executionsStatus, executionsTrigger, executionsSearch]);

  useEffect(() => {
    if (tab === 'history') loadExecutions();
  }, [tab, loadExecutions]);

  // ── Manual Execution ────────────────────────────────────────
  const handleExecuteRule = async (ruleId: string, ruleName: string) => {
    setExecutingRuleId(ruleId);
    try {
      const res = await fetch(`/api/admin/automation/rules/${ruleId}/execute`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Execution failed');

      if (json.data?.status === 'SUCCESS') {
        adminToast.success('Workflow Executed', `"${ruleName}" finished successfully.`);
      } else {
        adminToast.error('Execution Failed', json.data?.error || 'Execution returned a failure state.');
      }

      if (tab === 'overview') loadOverview();
      if (tab === 'rules') loadRules();
      if (tab === 'history') loadExecutions();
    } catch (e) {
      adminToast.error('Error', (e as Error).message);
    } finally {
      setExecutingRuleId(null);
    }
  };

  // ── Toggle Rule Active State ────────────────────────────────
  const handleToggleRule = async (rule: AutomationRuleItem) => {
    try {
      const res = await fetch(`/api/admin/automation/rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update rule');
      adminToast.success('Updated', `Rule "${rule.name}" is now ${!rule.isActive ? 'active' : 'disabled'}.`);
      loadRules();
    } catch (e) {
      adminToast.error('Error', (e as Error).message);
    }
  };

  // ── Delete Rule ─────────────────────────────────────────────
  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Are you sure you want to delete automation rule "${ruleName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/automation/rules/${ruleId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete rule');
      adminToast.success('Deleted', `Rule "${ruleName}" was deleted.`);
      loadRules();
    } catch (e) {
      adminToast.error('Error', (e as Error).message);
    }
  };

  // ── Save New Rule ───────────────────────────────────────────
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderName.trim()) {
      adminToast.error('Validation', 'Rule name is required.');
      return;
    }

    setBuilderSaving(true);
    try {
      let actionConfig: Record<string, unknown> = {};

      if (builderAction === 'SEND_EMAIL') {
        actionConfig = { to: builderEmailTo, subject: builderEmailSubject, body: builderEmailBody };
      } else if (builderAction === 'CREATE_NOTIFICATION') {
        actionConfig = { title: builderNotifTitle, message: builderNotifMessage };
      } else if (builderAction === 'UPDATE_RECORD') {
        actionConfig = { operation: builderRecordOp };
      } else if (builderAction === 'TRIGGER_WORKFLOW') {
        actionConfig = { workflow: builderWorkflow };
      } else if (builderAction === 'CREATE_AUDIT_LOG') {
        actionConfig = { eventName: builderName, note: builderDesc || 'Automated rule trigger' };
      }

      const res = await fetch('/api/admin/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: builderName,
          description: builderDesc || undefined,
          triggerType: builderTrigger,
          actionType: builderAction,
          actionConfig,
          schedule: builderTrigger === 'SCHEDULED' ? builderSchedule : undefined,
          isActive: builderActive,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create rule');

      adminToast.success('Created', `Automation rule "${builderName}" created successfully.`);
      // Reset form
      setBuilderName('');
      setBuilderDesc('');
      setTab('rules');
    } catch (err) {
      adminToast.error('Error', (err as Error).message);
    } finally {
      setBuilderSaving(false);
    }
  };

  // ── Export Handler ──────────────────────────────────────────
  const handleExport = async (format: 'csv' | 'excel' | 'pdf' | 'print') => {
    const params = new URLSearchParams({
      format,
      type: 'executions',
      status: executionsStatus,
      triggerType: executionsTrigger,
    });
    if (executionsSearch) params.set('search', executionsSearch);

    const res = await fetch(`/api/admin/automation/export?${params}`);
    if (!res.ok) throw new Error('Export failed');

    if (format === 'print') {
      const html = await res.text();
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        w.print();
      }
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'csv' ? 'csv' : format === 'excel' ? 'xls' : 'html';
    a.download = `automation-executions-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Rules Table Columns ─────────────────────────────────────
  const ruleColumns: Column<AutomationRuleItem>[] = [
    {
      key: 'name',
      header: 'Workflow Name',
      sortable: true,
      width: '220px',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)', fontSize: '13px' }}>{row.name}</div>
          {row.description && (
            <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)', marginTop: '2px' }}>
              {row.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'triggerType',
      header: 'Trigger Event',
      width: '150px',
      cell: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
          {TRIGGER_LABELS[row.triggerType] || row.triggerType}
        </span>
      ),
    },
    {
      key: 'actionType',
      header: 'Action',
      width: '160px',
      cell: (row) => (
        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--admin-accent)' }}>
          {ACTION_LABELS[row.actionType] || row.actionType}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      width: '100px',
      cell: (row) => <StatusBadge status={row.isActive ? 'active' : 'disabled'} size="sm" />,
    },
    {
      key: 'lastRunAt',
      header: 'Last Run',
      sortable: true,
      width: '130px',
      cell: (row) => <span style={{ fontSize: '12px', color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(row.lastRunAt)}</span>,
    },
    {
      key: 'successRate',
      header: 'Success Rate',
      width: '110px',
      cell: (row) => (
        <div style={{ fontSize: '12px', fontWeight: 600, color: row.successRate >= 90 ? '#2D7A4F' : '#D97706' }}>
          {row.totalRuns > 0 ? `${row.successRate}% (${row.totalRuns} runs)` : 'No runs'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '170px',
      cell: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => handleExecuteRule(row.id, row.name)}
            disabled={executingRuleId === row.id || !row.isActive}
            style={{ fontSize: '11px', padding: '4px 8px', height: 28 }}
            title="Execute Now"
          >
            {executingRuleId === row.id ? (
              <span className="admin-spinner admin-spinner-sm" />
            ) : (
              <Play size={11} />
            )}
            Run
          </button>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => handleToggleRule(row)}
            style={{ fontSize: '11px', padding: '4px 8px', height: 28 }}
            title={row.isActive ? 'Disable rule' : 'Enable rule'}
          >
            <Power size={12} color={row.isActive ? '#DC2626' : '#2D7A4F'} />
          </button>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => handleDeleteRule(row.id, row.name)}
            style={{ fontSize: '11px', padding: '4px 8px', height: 28 }}
            title="Delete rule"
          >
            <Trash2 size={12} color="var(--admin-text-tertiary)" />
          </button>
        </div>
      ),
    },
  ];

  // ── Executions Table Columns ────────────────────────────────
  const executionColumns: Column<AutomationExecutionItem>[] = [
    {
      key: 'id',
      header: 'Execution ID',
      width: '120px',
      cell: (row) => (
        <button
          onClick={() => {
            setSelectedExecution(row);
            setExecutionDrawerOpen(true);
          }}
          style={{ background: 'none', border: 'none', color: 'var(--admin-accent)', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}
        >
          #{row.id.slice(-8)}
        </button>
      ),
    },
    {
      key: 'ruleName',
      header: 'Automation Rule',
      width: '200px',
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)', fontSize: '13px' }}>{row.ruleName}</div>
          <div style={{ fontSize: '11px', color: 'var(--admin-text-tertiary)' }}>{ACTION_LABELS[row.actionType] || row.actionType}</div>
        </div>
      ),
    },
    {
      key: 'triggerType',
      header: 'Trigger',
      width: '140px',
      cell: (row) => (
        <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
          {TRIGGER_LABELS[row.triggerType] || row.triggerType}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '110px',
      cell: (row) => <StatusBadge status={row.status.toLowerCase()} size="sm" />,
    },
    {
      key: 'startedAt',
      header: 'Started At',
      sortable: true,
      width: '140px',
      cell: (row) => <span style={{ fontSize: '12px', color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(row.startedAt)}</span>,
    },
    {
      key: 'durationMs',
      header: 'Duration',
      width: '90px',
      cell: (row) => <span style={{ fontSize: '12px' }}>{row.durationMs !== null ? `${row.durationMs}ms` : '—'}</span>,
    },
    {
      key: 'executedBy',
      header: 'Triggered By',
      width: '130px',
      cell: (row) => <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>{row.executedBy}</span>,
    },
    {
      key: 'result',
      header: 'Result / Error',
      width: '180px',
      cell: (row) => (
        <span
          style={{
            fontSize: '11px',
            color: row.status === 'SUCCESS' ? '#2D7A4F' : '#DC2626',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            maxWidth: '180px',
          }}
          title={row.error || (row.result?.message as string) || 'Success'}
        >
          {row.error || (row.result?.message as string) || 'Execution completed'}
        </span>
      ),
    },
  ];

  // ── Render Tab 1: Overview ──────────────────────────────────
  const renderOverview = () => {
    if (overviewError) {
      return (
        <div className="admin-card" style={{ padding: 32, textAlign: 'center' }}>
          <AlertTriangle size={24} style={{ color: '#DC2626', marginBottom: 8 }} />
          <p style={{ color: 'var(--admin-text-secondary)' }}>Failed to load automation overview</p>
          <p style={{ fontSize: '12px', color: 'var(--admin-text-disabled)' }}>{overviewError}</p>
          <button className="admin-btn admin-btn-secondary" onClick={loadOverview} style={{ marginTop: 12 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      );
    }

    const k = overview?.kpis;

    return (
      <div>
        {/* KPI Stat Cards Grid */}
        <div
          className="admin-stat-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}
        >
          <StatCard label="Total Automations" value={k?.totalRules ?? 0} icon={<Workflow size={18} />} iconVariant="accent" loading={overviewLoading} />
          <StatCard label="Active Workflows" value={k?.activeRules ?? 0} icon={<Zap size={18} />} iconVariant="success" loading={overviewLoading} />
          <StatCard label="Disabled Workflows" value={k?.disabledRules ?? 0} icon={<Power size={18} />} iconVariant="warning" loading={overviewLoading} />
          <StatCard label="Executions Today" value={k?.executionsToday ?? 0} icon={<Calendar size={18} />} iconVariant="info" loading={overviewLoading} />
          <StatCard label="Successful Runs" value={k?.successfulExecutions ?? 0} icon={<CheckCircle2 size={18} />} iconVariant="success" loading={overviewLoading} />
          <StatCard label="Failed Runs" value={k?.failedExecutions ?? 0} icon={<AlertTriangle size={18} />} iconVariant="error" loading={overviewLoading} />
          <StatCard label="Success Rate" value={k ? `${k.successRate}%` : '100%'} icon={<ShieldCheck size={18} />} iconVariant="gold" loading={overviewLoading} />
          <StatCard label="Running Now" value={k?.runningExecutions ?? 0} icon={<Clock size={18} />} iconVariant="info" loading={overviewLoading} />
        </div>

        {/* Charts Grid */}
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div className="admin-card" style={{ padding: '20px' }}>
              <LineChart
                data={(overview.timeSeries || []).map((t) => ({ label: t.date, value: t.total }))}
                label="Total Workflow Executions"
                height={220}
              />
            </div>
            <div className="admin-card" style={{ padding: '20px' }}>
              <LineChart
                data={(overview.timeSeries || []).map((t) => ({ label: t.date, value: t.success }))}
                label="Successful Executions"
                color="#2D7A4F"
                height={220}
              />
            </div>
            <div className="admin-card" style={{ padding: '20px' }}>
              <DonutChart
                data={(overview.triggerTypeBreakdown || []).map((t) => ({
                  label: TRIGGER_LABELS[t.label] || t.label,
                  value: t.value,
                }))}
                label="Triggers"
              />
            </div>
            <div className="admin-card" style={{ padding: '20px' }}>
              <BarChart
                data={(overview.actionTypeBreakdown || []).map((a) => ({
                  label: ACTION_LABELS[a.label] || a.label,
                  value: a.value,
                }))}
                label="Action Breakdown"
                color="#C47C0A"
                height={220}
              />
            </div>
          </div>
        )}

        {/* Recent Executions Widget */}
        {overview && overview.recentExecutions.length > 0 && (
          <div className="admin-card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 14, fontFamily: 'var(--admin-font-display)' }}>
              Recent Workflow Executions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {overview.recentExecutions.slice(0, 5).map((e) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--admin-bg-secondary)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <StatusBadge status={e.status.toLowerCase()} size="sm" />
                    <div>
                      <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{e.ruleName}</span>
                      <span style={{ color: 'var(--admin-text-tertiary)', marginLeft: 8 }}>
                        ({TRIGGER_LABELS[e.triggerType] || e.triggerType})
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ color: 'var(--admin-text-tertiary)' }}>{fmtDateTime(e.startedAt)}</span>
                    <span style={{ fontWeight: 500, color: 'var(--admin-text-secondary)' }}>{e.durationMs ? `${e.durationMs}ms` : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Render Tab 2: Automations ────────────────────────────────
  const renderRules = () => {
    const toolbar = (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-disabled)' }} />
          <input
            className="admin-input"
            placeholder="Search workflows..."
            value={rulesSearch}
            onChange={(e) => setRulesSearch(e.target.value)}
            style={{ paddingLeft: 32, fontSize: '13px', height: 36 }}
          />
        </div>

        <select
          className="admin-select"
          value={rulesStatus}
          onChange={(e) => {
            setRulesStatus(e.target.value as 'ALL' | 'ACTIVE' | 'DISABLED');
            setRulesPage(1);
          }}
          style={{ fontSize: '12px', height: 36, minWidth: 120 }}
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </select>

        <select
          className="admin-select"
          value={rulesTrigger}
          onChange={(e) => {
            setRulesTrigger(e.target.value);
            setRulesPage(1);
          }}
          style={{ fontSize: '12px', height: 36, minWidth: 140 }}
        >
          {TRIGGER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'ALL' ? 'All Triggers' : TRIGGER_LABELS[t] || t}
            </option>
          ))}
        </select>

        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setTab('builder')}
          style={{ height: 36, fontSize: '12px' }}
        >
          <Plus size={14} /> New Workflow
        </button>
      </div>
    );

    return (
      <DataTable
        data={rules}
        columns={ruleColumns}
        loading={rulesLoading}
        error={rulesError}
        totalCount={rulesTotal}
        page={rulesPage}
        limit={rulesLimit}
        onPageChange={setRulesPage}
        onLimitChange={(l) => {
          setRulesLimit(l);
          setRulesPage(1);
        }}
        toolbar={toolbar}
        emptyTitle="No automation workflows found"
        emptyDescription="Create a new workflow rule to automate store operations, notifications, or maintenance."
        id="automation-rules-table"
        storageKey="blendify-automation-rules"
      />
    );
  };

  // ── Render Tab 3: Execution History ─────────────────────────
  const renderHistory = () => {
    const toolbar = (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-disabled)' }} />
          <input
            className="admin-input"
            placeholder="Search execution logs..."
            value={executionsSearch}
            onChange={(e) => setExecutionsSearch(e.target.value)}
            style={{ paddingLeft: 32, fontSize: '13px', height: 36 }}
          />
        </div>

        <select
          className="admin-select"
          value={executionsStatus}
          onChange={(e) => {
            setExecutionsStatus(e.target.value);
            setExecutionsPage(1);
          }}
          style={{ fontSize: '12px', height: 36, minWidth: 120 }}
        >
          <option value="ALL">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="RUNNING">Running</option>
          <option value="PENDING">Pending</option>
        </select>

        <select
          className="admin-select"
          value={executionsTrigger}
          onChange={(e) => {
            setExecutionsTrigger(e.target.value);
            setExecutionsPage(1);
          }}
          style={{ fontSize: '12px', height: 36, minWidth: 140 }}
        >
          {TRIGGER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t === 'ALL' ? 'All Triggers' : TRIGGER_LABELS[t] || t}
            </option>
          ))}
        </select>

        <ExportMenu onExport={handleExport} id="automation-export" />
      </div>
    );

    return (
      <>
        <DataTable
          data={executions}
          columns={executionColumns}
          loading={executionsLoading}
          error={executionsError}
          totalCount={executionsTotal}
          page={executionsPage}
          limit={executionsLimit}
          onPageChange={setExecutionsPage}
          onLimitChange={(l) => {
            setExecutionsLimit(l);
            setExecutionsPage(1);
          }}
          toolbar={toolbar}
          emptyTitle="No execution history found"
          emptyDescription="When automations trigger or are manually executed, safe logs will be recorded here."
          id="automation-executions-table"
          storageKey="blendify-automation-executions"
        />

        {/* Execution Detail Drawer */}
        <Drawer
          open={executionDrawerOpen}
          title={selectedExecution ? `Execution #${selectedExecution.id.slice(-8)}` : 'Execution Details'}
          subtitle={selectedExecution?.ruleName}
          width={560}
          onClose={() => {
            setExecutionDrawerOpen(false);
            setSelectedExecution(null);
          }}
        >
          {selectedExecution && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-card" style={{ padding: 16 }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: 10 }}>Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: 'var(--admin-text-tertiary)' }}>Status:</span>{' '}
                    <StatusBadge status={selectedExecution.status.toLowerCase()} size="sm" />
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-tertiary)' }}>Duration:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{selectedExecution.durationMs ? `${selectedExecution.durationMs}ms` : '—'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-tertiary)' }}>Trigger:</span>{' '}
                    <span>{TRIGGER_LABELS[selectedExecution.triggerType] || selectedExecution.triggerType}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-tertiary)' }}>Executed By:</span>{' '}
                    <span>{selectedExecution.executedBy}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-tertiary)' }}>Started:</span>{' '}
                    <span>{fmtDateTime(selectedExecution.startedAt)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--admin-text-tertiary)' }}>Completed:</span>{' '}
                    <span>{fmtDateTime(selectedExecution.completedAt)}</span>
                  </div>
                </div>
              </div>

              {selectedExecution.error && (
                <div className="admin-card" style={{ padding: 16, borderLeft: '4px solid #DC2626' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', marginBottom: 6 }}>Execution Error</h4>
                  <pre style={{ fontSize: '12px', color: 'var(--admin-text-secondary)', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {selectedExecution.error}
                  </pre>
                </div>
              )}

              {selectedExecution.result && (
                <div className="admin-card" style={{ padding: 16 }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: 6 }}>Execution Result</h4>
                  <pre
                    style={{
                      fontSize: '12px',
                      color: 'var(--admin-text-secondary)',
                      background: 'var(--admin-bg-secondary)',
                      padding: 12,
                      borderRadius: 6,
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(selectedExecution.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Drawer>
      </>
    );
  };

  // ── Render Tab 4: Workflow Builder ──────────────────────────
  const renderBuilder = () => {
    return (
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <form onSubmit={handleSaveRule} className="admin-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--admin-border)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#58131220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} style={{ color: 'var(--admin-accent)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>Create Automation Workflow</h3>
              <p style={{ fontSize: '12px', color: 'var(--admin-text-tertiary)' }}>Configure safe, automated triggers and business operations.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Step 1: Rule Details */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
                Workflow Name *
              </label>
              <input
                className="admin-input"
                placeholder="e.g. VIP Customer Loyalty Tier Upgrade"
                value={builderName}
                onChange={(e) => setBuilderName(e.target.value)}
                required
                style={{ fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
                Description (Optional)
              </label>
              <textarea
                className="admin-input"
                placeholder="Describe what this workflow accomplishes..."
                value={builderDesc}
                onChange={(e) => setBuilderDesc(e.target.value)}
                rows={2}
                style={{ fontSize: '13px', resize: 'vertical' }}
              />
            </div>

            {/* Step 2: Trigger */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
                  Trigger Event *
                </label>
                <select
                  className="admin-select"
                  value={builderTrigger}
                  onChange={(e) => setBuilderTrigger(e.target.value)}
                  style={{ fontSize: '13px' }}
                >
                  {TRIGGER_TYPES.filter((t) => t !== 'ALL').map((t) => (
                    <option key={t} value={t}>
                      {TRIGGER_LABELS[t] || t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
                  Action to Perform *
                </label>
                <select
                  className="admin-select"
                  value={builderAction}
                  onChange={(e) => setBuilderAction(e.target.value)}
                  style={{ fontSize: '13px' }}
                >
                  {ACTION_TYPES.filter((a) => a !== 'ALL').map((a) => (
                    <option key={a} value={a}>
                      {ACTION_LABELS[a] || a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Action-Specific Config */}
            {builderTrigger === 'SCHEDULED' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>
                  Schedule (Cron Expression / Description)
                </label>
                <input
                  className="admin-input"
                  placeholder="e.g. 0 0 * * * (Daily at midnight)"
                  value={builderSchedule}
                  onChange={(e) => setBuilderSchedule(e.target.value)}
                  style={{ fontSize: '13px' }}
                />
              </div>
            )}

            {builderAction === 'SEND_EMAIL' && (
              <div style={{ background: 'var(--admin-bg-secondary)', padding: 16, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                  <Mail size={14} /> Email Action Settings (Resend Guarded)
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Recipient Email</label>
                  <input
                    className="admin-input"
                    value={builderEmailTo}
                    onChange={(e) => setBuilderEmailTo(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Subject Line</label>
                  <input
                    className="admin-input"
                    value={builderEmailSubject}
                    onChange={(e) => setBuilderEmailSubject(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Email Body</label>
                  <textarea
                    className="admin-input"
                    value={builderEmailBody}
                    onChange={(e) => setBuilderEmailBody(e.target.value)}
                    rows={3}
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            )}

            {builderAction === 'CREATE_NOTIFICATION' && (
              <div style={{ background: 'var(--admin-bg-secondary)', padding: 16, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                  <Bell size={14} /> Notification Broadcast Settings
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Notification Title</label>
                  <input
                    className="admin-input"
                    value={builderNotifTitle}
                    onChange={(e) => setBuilderNotifTitle(e.target.value)}
                    style={{ fontSize: '12px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Message</label>
                  <textarea
                    className="admin-input"
                    value={builderNotifMessage}
                    onChange={(e) => setBuilderNotifMessage(e.target.value)}
                    rows={2}
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            )}

            {builderAction === 'UPDATE_RECORD' && (
              <div style={{ background: 'var(--admin-bg-secondary)', padding: 16, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                  <Database size={14} /> Supported Record Update Operation
                </div>
                <select
                  className="admin-select"
                  value={builderRecordOp}
                  onChange={(e) => setBuilderRecordOp(e.target.value)}
                  style={{ fontSize: '13px' }}
                >
                  {RECORD_OPERATIONS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {builderAction === 'TRIGGER_WORKFLOW' && (
              <div style={{ background: 'var(--admin-bg-secondary)', padding: 16, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                  <Layers size={14} /> Predefined Internal Workflow
                </div>
                <select
                  className="admin-select"
                  value={builderWorkflow}
                  onChange={(e) => setBuilderWorkflow(e.target.value)}
                  style={{ fontSize: '13px' }}
                >
                  {PREDEFINED_WORKFLOWS.map((wf) => (
                    <option key={wf.value} value={wf.value}>
                      {wf.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 4: Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <input
                type="checkbox"
                id="builder-active"
                checked={builderActive}
                onChange={(e) => setBuilderActive(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="builder-active" style={{ fontSize: '13px', color: 'var(--admin-text-primary)', cursor: 'pointer' }}>
                Enable workflow immediately upon creation
              </label>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="admin-btn admin-btn-ghost"
                onClick={() => setTab('rules')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={builderSaving}
                style={{ minWidth: 130 }}
              >
                {builderSaving ? <span className="admin-spinner admin-spinner-sm" /> : <CheckCircle2 size={14} />}
                Save Workflow
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

  // ── Tabs Header ─────────────────────────────────────────────
  const tabs = (
    <div style={{ display: 'flex', gap: 0 }}>
      {[
        { key: 'overview', label: 'Overview' },
        { key: 'rules', label: 'Automations' },
        { key: 'history', label: 'Execution History' },
        { key: 'builder', label: 'Workflow Builder' },
      ].map((t) => (
        <button
          key={t.key}
          className={`admin-tab${tab === t.key ? ' active' : ''}`}
          onClick={() => setTab(t.key as typeof tab)}
          role="tab"
          aria-selected={tab === t.key}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Automation & Workflows"
        subtitle="Manage business rules, scheduled tasks, automated triggers, and execution history"
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Automation' },
        ]}
        tabs={tabs}
        actions={
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              if (tab === 'overview') loadOverview();
              if (tab === 'rules') loadRules();
              if (tab === 'history') loadExecutions();
            }}
            style={{ fontSize: '12px' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div style={{ marginTop: 20 }}>
        {tab === 'overview' && renderOverview()}
        {tab === 'rules' && renderRules()}
        {tab === 'history' && renderHistory()}
        {tab === 'builder' && renderBuilder()}
      </div>
    </>
  );
}
