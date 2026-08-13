// ============================================================
// BLENDIFY — Admin Module: Footer Manager
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Layout, Save } from 'lucide-react';

export default function FooterBuilderPage() {
  const [copyrightText, setCopyrightText] = useState(
    '© 2026 BLENDIFY Specialty Coffee Pvt Ltd. All Rights Reserved.'
  );
  const [newsletterHeadline, setNewsletterHeadline] = useState(
    'Subscribe for Fresh Roast Release Alerts & 10% Off Your First Bag'
  );
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = () => {
    setToast({ message: 'Footer branding & copyright saved!', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Footer Manager & Legal Copy"
        subtitle="Manage storefront footer columns, copyright notices & newsletter subscribe banners"
        actionLabel="Save Footer"
        onAction={handleSave}
      />

      <div className="admin-card space-y-4">
        <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
          <Layout className="w-5 h-5 text-amber-700" /> Footer Text & Newsletter Banner
        </h3>

        <div>
          <label className="block text-xs font-semibold mb-1">Copyright Notice Text</label>
          <input
            type="text"
            value={copyrightText}
            onChange={(e) => setCopyrightText(e.target.value)}
            className="admin-input"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Footer Newsletter Signup Headline</label>
          <input
            type="text"
            value={newsletterHeadline}
            onChange={(e) => setNewsletterHeadline(e.target.value)}
            className="admin-input"
          />
        </div>
      </div>
    </div>
  );
}
