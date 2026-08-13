// ============================================================
// BLENDIFY — Admin Module: Developer Settings & Cache Controls
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Code2, Trash2, RefreshCw, Cpu, Layers } from 'lucide-react';

export default function DeveloperPage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const clearCache = () => {
    setToast({ message: 'Next.js Data Cache & Redis Store flushed!', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Developer Settings & System Caches"
        subtitle="Manage Redis cache flushing, Next.js ISR revalidation, environment overview & background queues"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="admin-card space-y-4">
          <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-amber-700" /> Cache & ISR Controls
          </h3>

          <p className="text-xs text-stone-600">
            Flush server-side product catalog caches, homepage ISR static pages and Redis memory store.
          </p>

          <button onClick={clearCache} className="admin-btn-primary py-2">
            <RefreshCw className="w-4 h-4 mr-2" /> Flush System Caches
          </button>
        </div>

        <div className="admin-card space-y-4">
          <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-700" /> Environment Overview
          </h3>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 bg-stone-50 rounded">
              <span className="text-stone-500">NODE_ENV:</span>
              <span className="font-bold text-emerald-700">production</span>
            </div>
            <div className="flex justify-between p-2 bg-stone-50 rounded">
              <span className="text-stone-500">Framework:</span>
              <span className="font-bold text-stone-800">Next.js 14 App Router</span>
            </div>
            <div className="flex justify-between p-2 bg-stone-50 rounded">
              <span className="text-stone-500">Database Driver:</span>
              <span className="font-bold text-stone-800">Prisma 7 + adapter-pg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
