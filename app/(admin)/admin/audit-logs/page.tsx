// ============================================================
// BLENDIFY — Admin Module: Audit Logs
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { History, Search, Filter } from 'lucide-react';

interface AuditItem {
  id: string;
  userEmail: string;
  action: string;
  module: string;
  entityLabel: string;
  ip: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs] = useState<AuditItem[]>([
    { id: 'al_1', userEmail: 'admin@blendify.coffee', action: 'UPDATE', module: 'settings', entityLabel: 'Store Settings', ip: '127.0.0.1', createdAt: '2026-08-04T18:45:00Z' },
    { id: 'al_2', userEmail: 'admin@blendify.coffee', action: 'CREATE', module: 'coupons', entityLabel: 'ROAST15', ip: '127.0.0.1', createdAt: '2026-08-04T17:30:00Z' },
    { id: 'al_3', userEmail: 'roaster@blendify.coffee', action: 'UPDATE', module: 'inventory', entityLabel: 'Dark Roast 500g', ip: '192.168.1.5', createdAt: '2026-08-04T16:15:00Z' },
  ]);

  const [search, setSearch] = useState('');
  const filtered = logs.filter((l) => l.userEmail.toLowerCase().includes(search.toLowerCase()) || l.module.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page-container">
      <PageHeader
        title="Audit Logs & Compliance Trail"
        subtitle="Immutable security trail of every admin action, who performed it, timestamp, IP & changes"
      />

      <div className="admin-table-toolbar mb-4">
        <div className="admin-search-input">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search audit logs by email or module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Target Entity</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td className="font-mono text-xs text-stone-500">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="font-medium text-stone-900">{l.userEmail}</td>
                <td>
                  <span className="font-mono text-xs px-2 py-0.5 bg-stone-100 font-bold rounded">
                    {l.action}
                  </span>
                </td>
                <td className="capitalize font-semibold text-amber-900">{l.module}</td>
                <td className="text-stone-700">{l.entityLabel}</td>
                <td className="font-mono text-xs text-stone-500">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
