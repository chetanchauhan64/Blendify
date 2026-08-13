// ============================================================
// BLENDIFY — Admin Module: Integrations & API Keys
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Plug, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';

interface Integration {
  id: string;
  service: string;
  displayName: string;
  isEnabled: boolean;
  config: Record<string, any>;
  status: string;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { id: '1', service: 'ga', displayName: 'Google Analytics 4', isEnabled: true, config: { measurementId: 'G-BLENDIFY123' }, status: 'connected' },
    { id: '2', service: 'gtm', displayName: 'Google Tag Manager', isEnabled: true, config: { containerId: 'GTM-BLND89' }, status: 'connected' },
    { id: '3', service: 'posthog', displayName: 'PostHog Product Analytics', isEnabled: false, config: { apiKey: '' }, status: 'disconnected' },
    { id: '4', service: 'sentry', displayName: 'Sentry Error Monitoring', isEnabled: true, config: { dsn: 'https://key@sentry.io/123' }, status: 'connected' },
    { id: '5', service: 'cloudinary', displayName: 'Cloudinary Media CDN', isEnabled: true, config: { cloudName: 'blendify' }, status: 'connected' },
    { id: '6', service: 'resend', displayName: 'Resend Transactional Email', isEnabled: true, config: { apiKey: 're_live_key' }, status: 'connected' },
    { id: '7', service: 'meta_pixel', displayName: 'Meta Pixel (Facebook Ads)', isEnabled: true, config: { pixelId: '9988776655' }, status: 'connected' },
    { id: '8', service: 'gsc', displayName: 'Google Search Console', isEnabled: true, config: { verificationToken: 'gsc_token_123' }, status: 'connected' },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toggle = (id: string) => {
    setIntegrations(integrations.map((i) => (i.id === id ? { ...i, isEnabled: !i.isEnabled, status: !i.isEnabled ? 'connected' : 'disconnected' } : i)));
    setToast({ message: 'Integration status updated', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Third-Party Integrations & Analytics"
        subtitle="Manage connections for Google Analytics, GTM, PostHog, Sentry, Cloudinary, Resend, Meta Pixel & GSC"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => (
          <div key={item.id} className="admin-card border flex justify-between items-center p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
                <Plug className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">{item.displayName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2 h-2 rounded-full ${item.isEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  <span className="text-xs text-stone-500 capitalize">{item.status}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggle(item.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                item.isEnabled ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              {item.isEnabled ? 'Active' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
