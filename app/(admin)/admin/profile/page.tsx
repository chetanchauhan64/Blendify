// ============================================================
// BLENDIFY — Admin Module: Admin Profile & Security
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { UserCheck, Shield, KeyRound, Laptop, Save, LogOut } from 'lucide-react';

export default function AdminProfilePage() {
  const [formData, setFormData] = useState({
    firstName: 'Admin',
    lastName: 'Console',
    email: 'admin@blendify.coffee',
    phone: '+91 98765 43210',
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast({ message: 'Profile details saved!', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Admin Account & Security Settings"
        subtitle="Update profile details, password, 2FA authentication, and manage active login sessions"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details */}
        <form onSubmit={handleSave} className="admin-card space-y-4">
          <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-700" /> Account Information
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="admin-input"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="admin-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="admin-input"
            />
          </div>

          <button type="submit" className="admin-btn-primary mt-2">
            <Save className="w-4 h-4 mr-2" /> Save Profile
          </button>
        </form>

        {/* Active Sessions */}
        <div className="admin-card space-y-4">
          <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <Laptop className="w-5 h-5 text-amber-700" /> Active Logged-in Devices
          </h3>

          <div className="p-3 bg-stone-50 rounded-xl border flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-stone-900">macOS (Chrome) — Current Session</p>
              <span className="text-stone-500 font-mono">127.0.0.1 · Active now</span>
            </div>
            <span className="text-emerald-700 font-semibold">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
