// ============================================================
// BLENDIFY — Admin Module: Roles & Visual Permission Matrix
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { ShieldCheck, Check, X, Save } from 'lucide-react';

interface ModulePermission {
  module: string;
  read: boolean;
  write: boolean;
  delete: boolean;
}

export default function RolesPage() {
  const [permissions, setPermissions] = useState<ModulePermission[]>([
    { module: 'Products & Inventory', read: true, write: true, delete: true },
    { module: 'Orders & Shipments', read: true, write: true, delete: false },
    { module: 'Coupons & Discounts', read: true, write: true, delete: true },
    { module: 'Store Settings & Tax', read: true, write: false, delete: false },
    { module: 'Staff & Security', read: true, write: false, delete: false },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toggle = (idx: number, type: 'read' | 'write' | 'delete') => {
    const updated = [...permissions];
    updated[idx][type] = !updated[idx][type];
    setPermissions(updated);
  };

  const handleSave = () => {
    setToast({ message: 'Role permission matrix saved successfully!', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Role-Based Access Control (RBAC) Matrix"
        subtitle="Visual permission matrix to configure Read, Write, and Delete permissions per admin role"
        actionLabel="Save Permissions"
        onAction={handleSave}
      />

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Admin Module</th>
              <th>Read Access</th>
              <th>Create / Edit</th>
              <th>Delete Access</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p, idx) => (
              <tr key={p.module}>
                <td className="font-bold text-stone-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700" /> {p.module}
                </td>
                <td>
                  <button
                    onClick={() => toggle(idx, 'read')}
                    className={`p-1.5 rounded-md ${p.read ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}
                  >
                    {p.read ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => toggle(idx, 'write')}
                    className={`p-1.5 rounded-md ${p.write ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}
                  >
                    {p.write ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => toggle(idx, 'delete')}
                    className={`p-1.5 rounded-md ${p.delete ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-400'}`}
                  >
                    {p.delete ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
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
