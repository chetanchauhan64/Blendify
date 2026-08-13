// ============================================================
// BLENDIFY — Admin Module: Maintenance Mode
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { ShieldAlert, Save, Clock, ShieldCheck } from 'lucide-react';

export default function MaintenancePage() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState('We are currently roasting new batches! Site back online shortly.');
  const [whitelistIps, setWhitelistIps] = useState('127.0.0.1, 192.168.1.1');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast({ message: `Maintenance mode ${isEnabled ? 'ENABLED' : 'DISABLED'}`, type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Maintenance Mode & Store Shutdown"
        subtitle="Temporarily pause storefront access, display maintenance notice & whitelist developer IPs"
      />

      <form onSubmit={handleSave} className="admin-card max-w-xl space-y-4">
        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border">
          <div>
            <h4 className="font-bold text-stone-900 text-sm">Storefront Maintenance Lock</h4>
            <p className="text-xs text-stone-500">Redirect non-admin visitors to maintenance page</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
              isEnabled ? 'bg-red-600 justify-end' : 'bg-stone-300 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Maintenance Customer Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="admin-textarea"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Whitelisted IP Addresses (Comma separated)</label>
          <input
            type="text"
            value={whitelistIps}
            onChange={(e) => setWhitelistIps(e.target.value)}
            className="admin-input font-mono text-xs"
          />
        </div>

        <button type="submit" className="admin-btn-primary">
          <Save className="w-4 h-4 mr-2" /> Save Maintenance Settings
        </button>
      </form>
    </div>
  );
}
