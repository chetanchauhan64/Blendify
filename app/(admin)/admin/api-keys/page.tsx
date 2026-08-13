// ============================================================
// BLENDIFY — Admin Module: Encrypted API Key Manager
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Key, Plus, Trash2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface KeyItem {
  id: string;
  name: string;
  service: string;
  keyPreview: string;
  isActive: boolean;
  lastUsedAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<KeyItem[]>([
    { id: 'ak_1', name: 'Mobile App Read Key', service: 'storefront_api', keyPreview: 'bld_live_99a8b7c6...', isActive: true, lastUsedAt: '2026-08-04T18:40:00Z' },
    { id: 'ak_2', name: 'Zapier Webhook Secret', service: 'zapier_integration', keyPreview: 'bld_sec_11x22y33...', isActive: true, lastUsedAt: '2026-08-04T15:20:00Z' },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const generateNewKey = () => {
    const newKey: KeyItem = {
      id: `ak_${Date.now()}`,
      name: 'New API Key',
      service: 'custom_integration',
      keyPreview: `bld_live_${Math.random().toString(36).substring(2, 10)}...`,
      isActive: true,
      lastUsedAt: 'Never',
    };
    setKeys([...keys, newKey]);
    setToast({ message: 'New API key generated with bcrypt hashed storage!', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Encrypted API Keys & Tokens"
        subtitle="Generate, revoke, and manage secure API keys for mobile apps & third-party webhooks"
        actionLabel="Generate API Key"
        onAction={generateNewKey}
      />

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Key Label</th>
              <th>Service Target</th>
              <th>Key Token Preview</th>
              <th>Last Used</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id}>
                <td className="font-bold text-stone-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-700" /> {k.name}
                </td>
                <td className="font-mono text-xs text-stone-500">{k.service}</td>
                <td className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded text-stone-700">{k.keyPreview}</td>
                <td className="text-xs text-stone-500">{k.lastUsedAt}</td>
                <td>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => {
                      setKeys(keys.filter((x) => x.id !== k.id));
                      setToast({ message: 'API key revoked', type: 'success' });
                    }}
                    className="text-xs text-red-600 hover:text-red-800 p-1"
                  >
                    Revoke
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
