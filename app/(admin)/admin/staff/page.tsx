// ============================================================
// BLENDIFY — Admin Module: Staff Accounts & Invites
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { UserCheck, UserPlus, Mail, Shield, CheckCircle2, XCircle } from 'lucide-react';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([
    { id: '1', name: 'Super Admin', email: 'admin@blendify.coffee', role: 'SUPER_ADMIN', status: 'ACTIVE' },
    { id: '2', name: 'Roastery Lead', email: 'roaster@blendify.coffee', role: 'WAREHOUSE', status: 'ACTIVE' },
    { id: '3', name: 'Support Rep', email: 'support@blendify.coffee', role: 'SUPPORT', status: 'PENDING' },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toggleStatus = (id: string) => {
    setStaff(staff.map((s) => (s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : s)));
    setToast({ message: 'Staff status updated', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Staff Accounts & Team Access"
        subtitle="Invite team members, assign RBAC roles, suspend or deactivate staff accounts"
      />

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Email</th>
              <th>Assigned Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="font-bold text-stone-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-700" /> {s.name}
                </td>
                <td className="font-mono text-xs">{s.email}</td>
                <td>
                  <span className="font-semibold text-xs text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                    {s.role}
                  </span>
                </td>
                <td>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
                <td>
                  {s.role !== 'SUPER_ADMIN' && (
                    <button
                      onClick={() => toggleStatus(s.id)}
                      className="text-xs px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded"
                    >
                      {s.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
