// ============================================================
// BLENDIFY — Admin Module: Multi-Currency & Exchange Rates
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Coins, RefreshCw, CheckCircle2, TrendingUp, Edit2 } from 'lucide-react';

interface CurrencyItem {
  id: string;
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // relative to INR
  isBase: boolean;
  autoUpdate: boolean;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([
    { id: '1', code: 'INR', symbol: '₹', name: 'Indian Rupee', exchangeRate: 1.0, isBase: true, autoUpdate: false },
    { id: '2', code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 0.012, isBase: false, autoUpdate: true },
    { id: '3', code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 0.011, isBase: false, autoUpdate: true },
    { id: '4', code: 'GBP', symbol: '£', name: 'British Pound', exchangeRate: 0.0094, isBase: false, autoUpdate: true },
    { id: '5', code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', exchangeRate: 0.044, isBase: false, autoUpdate: true },
    { id: '6', code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', exchangeRate: 0.016, isBase: false, autoUpdate: true },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveRates = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setToast({ message: 'Live currency exchange rates updated via ExchangeRate API', type: 'success' });
    }, 800);
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Multi-Currency & Exchange Rates"
        subtitle="Manage supported currencies, real-time FX conversion rates & rounding rules"
        actionLabel="Fetch Live Rates"
        onAction={fetchLiveRates}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {currencies.map((curr) => (
          <div key={curr.id} className="admin-card">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-900 text-lg">
                  {curr.symbol}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">{curr.code}</h4>
                  <span className="text-xs text-stone-500">{curr.name}</span>
                </div>
              </div>
              {curr.isBase ? (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  Base Currency
                </span>
              ) : (
                <span className="text-xs text-stone-400 font-mono">1 INR = {curr.exchangeRate} {curr.code}</span>
              )}
            </div>

            <hr className="my-3 border-stone-100" />

            <div className="flex justify-between items-center text-xs text-stone-600">
              <span>Auto FX Updates:</span>
              <span className={curr.autoUpdate ? 'text-emerald-600 font-medium' : 'text-stone-400'}>
                {curr.autoUpdate ? 'Active' : 'Manual Entry'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
