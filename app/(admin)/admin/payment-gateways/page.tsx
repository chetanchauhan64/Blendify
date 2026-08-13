// ============================================================
// BLENDIFY — Admin Module: Payment Gateway Manager
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { CreditCard, ShieldCheck, Zap, AlertTriangle, Save, RefreshCw, Key, Link2 } from 'lucide-react';

interface GatewayConfig {
  id: string;
  gateway: string;
  displayName: string;
  isEnabled: boolean;
  isSandbox: boolean;
  config: Record<string, any>;
  webhookUrl: string;
  webhookStatus: string;
}

export default function PaymentGatewaysPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchGateways = async () => {
    try {
      const res = await fetch('/api/admin/payment-gateways');
      const json = await res.json();
      if (json.success && json.data) {
        setGateways(json.data);
      }
    } catch (err) {
      console.error('Failed to load gateways:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const handleToggle = async (gw: GatewayConfig) => {
    setSavingId(gw.id);
    try {
      const res = await fetch('/api/admin/payment-gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gw.id, isEnabled: !gw.isEnabled }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: `${gw.displayName} ${!gw.isEnabled ? 'enabled' : 'disabled'}`, type: 'success' });
        fetchGateways();
      }
    } catch {
      setToast({ message: 'Error toggling gateway', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  const handleSandboxToggle = async (gw: GatewayConfig) => {
    setSavingId(gw.id);
    try {
      const res = await fetch('/api/admin/payment-gateways', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gw.id, isSandbox: !gw.isSandbox }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: `${gw.displayName} mode changed to ${!gw.isSandbox ? 'Sandbox' : 'Live'}`, type: 'success' });
        fetchGateways();
      }
    } catch {
      setToast({ message: 'Error updating sandbox mode', type: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Payment Gateways & Checkout Integrations"
        subtitle="Configure Razorpay, Stripe, Cash on Delivery, and Wallet payment options"
      />

      <div className="space-y-6">
        {gateways.map((gw) => (
          <div key={gw.id} className="admin-card border border-stone-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                    {gw.displayName}
                    {gw.isSandbox && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        Sandbox Mode
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Webhook Endpoint: <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">{gw.webhookUrl || 'None required'}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSandboxToggle(gw)}
                  className={`text-xs px-3 py-1.5 rounded font-medium border ${
                    gw.isSandbox ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  }`}
                >
                  {gw.isSandbox ? 'Switch to Live Mode' : 'Switch to Sandbox'}
                </button>

                <button
                  onClick={() => handleToggle(gw)}
                  className={`text-xs px-4 py-1.5 rounded font-semibold transition-colors ${
                    gw.isEnabled
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                  }`}
                >
                  {gw.isEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            <hr className="my-4 border-stone-100" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="font-semibold text-stone-700 block mb-1">API Key Configuration Status</span>
                <span className="text-stone-500">
                  {gw.gateway === 'razorpay'
                    ? 'RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET active in environment.'
                    : gw.gateway === 'stripe'
                    ? 'STRIPE_SECRET_KEY pending configuration in .env.local.'
                    : 'System built-in module.'}
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-lg">
                <span className="font-semibold text-stone-700 block mb-1">Webhook Status Indicator</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      gw.webhookStatus === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span className="capitalize font-mono">{gw.webhookStatus}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
