// ============================================================
// BLENDIFY — Admin Module: robots.txt Visual Editor
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { FileCode, Save, RefreshCw, Eye } from 'lucide-react';

export default function RobotsTxtPage() {
  const [content, setContent] = useState(
    `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://blendify.coffee/sitemap.xml`
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast({ message: 'robots.txt rules updated successfully!', type: 'success' });
    }, 500);
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="robots.txt Visual Editor"
        subtitle="Manage search engine crawler access rules, disallowed paths & sitemap location"
      />

      <div className="admin-card space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-700" /> Web Crawler Instructions
          </h3>
          <span className="text-xs font-mono text-stone-400">Path: /robots.txt</span>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          className="admin-textarea font-mono text-xs leading-relaxed"
        />

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className="admin-btn-primary">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save robots.txt
          </button>
        </div>
      </div>
    </div>
  );
}
