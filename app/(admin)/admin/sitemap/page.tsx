// ============================================================
// BLENDIFY — Admin Module: XML Sitemap Generator
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Network, RefreshCw, Download, CheckCircle2, Globe } from 'lucide-react';

export default function SitemapPage() {
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastGenerated, setLastGenerated] = useState('2026-08-04T18:30:00Z');

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setLastGenerated(new Date().toISOString());
      setToast({ message: 'XML sitemap re-generated with 48 URLs!', type: 'success' });
    }, 1000);
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="XML Sitemap Manager"
        subtitle="Auto-generate and submit search engine sitemaps for products, collections & pages"
        actionLabel="Re-generate Sitemap"
        onAction={handleGenerate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="admin-card space-y-4">
          <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            <Network className="w-5 h-5 text-amber-700" /> Sitemap Summary
          </h3>

          <div className="p-4 bg-stone-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-500">Sitemap URL:</span>
              <span className="font-mono font-semibold text-stone-800">https://blendify.coffee/sitemap.xml</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Last Generated:</span>
              <span className="font-mono text-stone-700">{new Date(lastGenerated).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Indexed URLs:</span>
              <span className="font-semibold text-emerald-700">48 Pages</span>
            </div>
          </div>
        </div>

        <div className="admin-card space-y-4">
          <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-700" /> Search Engine Ping Status
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 border rounded-lg flex justify-between items-center">
              <span>Google Search Console Ping</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Submitted
              </span>
            </div>
            <div className="p-3 border rounded-lg flex justify-between items-center">
              <span>Bing Webmaster Ping</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Submitted
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
