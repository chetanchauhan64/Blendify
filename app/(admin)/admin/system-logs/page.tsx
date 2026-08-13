// ============================================================
// BLENDIFY — Admin Module: System & Application Logs
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { FileTerminal, Search, Filter, RefreshCw } from 'lucide-react';

interface LogLine {
  id: string;
  type: 'app' | 'api' | 'auth' | 'db';
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export default function SystemLogsPage() {
  const [logs] = useState<LogLine[]>([
    { id: 'l1', type: 'api', level: 'info', message: 'GET /api/admin/dashboard/stats 200 OK - 18ms', timestamp: '2026-08-04T18:50:01Z' },
    { id: 'l2', type: 'auth', level: 'info', message: 'User admin@blendify.coffee session authenticated', timestamp: '2026-08-04T18:49:12Z' },
    { id: 'l3', type: 'db', level: 'info', message: 'Prisma Client initialized with PostgreSQL adapter', timestamp: '2026-08-04T18:30:00Z' },
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'app' | 'api' | 'auth' | 'db'>('all');

  const filtered = logs.filter((l) => activeTab === 'all' || l.type === activeTab);

  return (
    <div className="admin-page-container">
      <PageHeader
        title="System Logs & Terminal Stream"
        subtitle="Live application stdout, API request logs, authentication events & database query traces"
      />

      <div className="admin-card space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          {(['all', 'app', 'api', 'auth', 'db'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${
                activeTab === tab ? 'bg-amber-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab} Logs
            </button>
          ))}
        </div>

        <div className="bg-stone-950 text-amber-100 p-4 rounded-xl font-mono text-xs space-y-1.5 leading-relaxed overflow-x-auto min-h-[300px]">
          {filtered.map((l) => (
            <div key={l.id} className="flex items-start gap-3">
              <span className="text-stone-500 flex-shrink-0">{l.timestamp}</span>
              <span className="uppercase text-amber-500 font-bold flex-shrink-0">[{l.type}]</span>
              <span className={l.level === 'error' ? 'text-red-400' : 'text-stone-300'}>{l.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
