// ============================================================
// BLENDIFY — Admin Module: Feature Flags & Experiments
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Flag, Zap, CheckCircle2, XCircle } from 'lucide-react';

interface FlagItem {
  id: string;
  key: string;
  label: string;
  description: string;
  isEnabled: boolean;
  isExperimental: boolean;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FlagItem[]>([
    { id: 'ff_1', key: 'subscriptions_v2', label: 'Recurring Subscriptions V2', description: 'Enable custom delivery schedules and roast preference quiz', isEnabled: true, isExperimental: false },
    { id: 'ff_2', key: 'ai_coffee_recommendations', label: 'AI Bean Recommender', description: 'Personalized coffee beans match based on brewing method', isEnabled: true, isExperimental: true },
    { id: 'ff_3', key: 'multi_currency_checkout', label: 'Multi-Currency Checkout', description: 'Display prices in USD, EUR, GBP, and AED automatically', isEnabled: true, isExperimental: false },
    { id: 'ff_4', key: 'instant_whatsapp_notifications', label: 'WhatsApp Dispatch Alerts', description: 'Send real-time tracking links on WhatsApp', isEnabled: false, isExperimental: true },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toggle = (id: string) => {
    setFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isEnabled: !f.isEnabled } : f))
    );
    setToast({ message: 'Feature flag updated', type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Feature Flags & Experimental Toggles"
        subtitle="Safely roll out new storefront features, A/B experiments & beta capabilities"
      />

      <div className="space-y-4">
        {flags.map((flag) => (
          <div key={flag.id} className="admin-card flex justify-between items-center p-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-stone-900 text-sm">{flag.label}</h4>
                {flag.isExperimental && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Experimental
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-1">{flag.description}</p>
              <code className="text-[10px] text-stone-400 font-mono mt-1 block">Key: {flag.key}</code>
            </div>

            <button
              onClick={() => toggle(flag.id)}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                flag.isEnabled ? 'bg-emerald-600 justify-end' : 'bg-stone-300 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
