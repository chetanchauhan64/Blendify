// ============================================================
// BLENDIFY — Admin Module: Database Backup & Restore
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Database, Download, RefreshCw, HardDriveUpload, CheckCircle2 } from 'lucide-react';

interface BackupItem {
  id: string;
  filename: string;
  sizeMb: number;
  type: string;
  createdAt: string;
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupItem[]>([
    { id: 'b1', filename: 'blendify_pg_backup_2026-08-04_daily.sql.gz', sizeMb: 14.8, type: 'Scheduled Daily', createdAt: '2026-08-04T02:00:00Z' },
    { id: 'b2', filename: 'blendify_pg_backup_2026-08-03_daily.sql.gz', sizeMb: 14.2, type: 'Scheduled Daily', createdAt: '2026-08-03T02:00:00Z' },
  ]);

  const [backingUp, setBackingUp] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleManualBackup = () => {
    setBackingUp(true);
    setTimeout(() => {
      setBackingUp(false);
      const newBkp: BackupItem = {
        id: `b_${Date.now()}`,
        filename: `blendify_manual_${new Date().toISOString().split('T')[0]}.sql.gz`,
        sizeMb: 15.1,
        type: 'Manual Admin Snapshot',
        createdAt: new Date().toISOString(),
      };
      setBackups([newBkp, ...backups]);
      setToast({ message: 'Full PostgreSQL database backup snapshot created!', type: 'success' });
    }, 1200);
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="PostgreSQL Backup & Disaster Recovery"
        subtitle="Trigger manual database dumps, configure automated daily backups & restore snapshots"
        actionLabel="Create Backup Now"
        onAction={handleManualBackup}
      />

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Backup File</th>
              <th>Backup Type</th>
              <th>File Size</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id}>
                <td className="font-mono font-bold text-xs text-stone-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-700" /> {b.filename}
                </td>
                <td className="text-xs text-stone-600">{b.type}</td>
                <td className="font-mono text-xs text-stone-500">{b.sizeMb} MB</td>
                <td className="font-mono text-xs text-stone-500">{new Date(b.createdAt).toLocaleString()}</td>
                <td>
                  <button className="admin-btn-secondary text-xs py-1 px-3">
                    <Download className="w-3.5 h-3.5 mr-1" /> Download .sql.gz
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
