// ============================================================
// BLENDIFY — Admin Module: FAQ Categories & Questions
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { HelpCircle, Plus, Edit2, Trash2, Search, Save } from 'lucide-react';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([
    { id: 'f1', category: 'Orders & Shipping', question: 'How fresh is the coffee when it arrives?', answer: 'All coffee is roasted within 48 hours of dispatch and sealed in one-way valve degassing bags.' },
    { id: 'f2', category: 'Orders & Shipping', question: 'Do you offer free shipping?', answer: 'Yes! All domestic orders above ₹999 qualify for free express shipping.' },
    { id: 'f3', category: 'Brewing & Storage', question: 'Should I freeze my coffee beans?', answer: 'We recommend storing beans in an airtight container at room temperature away from sunlight.' },
  ]);

  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filtered = faqs.filter((f) => f.question.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="FAQ Categories & Questions"
        subtitle="Manage frequently asked questions, customer help center categories & instant answers"
      />

      <div className="admin-table-toolbar mb-4">
        <div className="admin-search-input">
          <Search className="w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search FAQs by question or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((faq) => (
          <div key={faq.id} className="admin-card">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                  {faq.category}
                </span>
                <h4 className="font-bold text-stone-900 text-sm mt-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-700" /> {faq.question}
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
