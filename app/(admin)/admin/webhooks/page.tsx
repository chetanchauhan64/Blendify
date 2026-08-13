// ============================================================
// BLENDIFY — Admin Module: Webhook Manager & Dispatch Logs
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Webhook, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  lastStatus: number;
}

export default function WebhooksPage() {
  const [webhooks] = useState<WebhookItem[]>([
    { id: 'wh_1', name: 'ERP Order Sync', url: 'https://api.blendify.coffee/webhooks/orders', events: ['order.created', 'order.paid'], lastStatus: 200 },
    { id: 'wh_2', name: 'Fulfillment Dispatch Alert', url: 'https://wms.blendify.coffee/api/dispatch', events: ['shipment.created'], lastStatus: 200 },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const retryWebhook = (name: string) => {
    setToast({ message: `Webhook '${name}' manually retried (200 OK)`, type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Webhook Manager & Event Listeners"
        subtitle="Manage outgoing event webhooks, payload dispatch logs & retry failed requests"
      />

      <div className="space-y-4">
        {webhooks.map((wh) => (
          <div key={wh.id} className="admin-card border flex justify-between items-center p-4">
            <div>
              <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Webhook className="w-4 h-4 text-amber-700" /> {wh.name}
              </h4>
              <code className="text-xs text-stone-500 font-mono mt-1 block">{wh.url}</code>
              <div className="flex gap-1.5 mt-2">
                {wh.events.map((e) => (
                  <span key={e} className="bg-amber-100 text-amber-900 text-[10px] font-mono font-semibold px-2 py-0.5 rounded">
                    {e}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                HTTP {wh.lastStatus}
              </span>
              <button
                onClick={() => retryWebhook(wh.name)}
                className="admin-btn-secondary text-xs py-1 px-3"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
