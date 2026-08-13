// ============================================================
// BLENDIFY — Admin Module: Realtime Activity Timeline
// ============================================================
'use client';

import React from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Activity, ShoppingCart, UserPlus, Star, Tag } from 'lucide-react';

export default function ActivityPage() {
  const events = [
    { id: 'e1', title: 'New Order #BLND-1049 Placed', desc: 'Aarav K. ordered 2x Dark Roast Whole Beans (₹1,198)', time: '5 mins ago', icon: ShoppingCart },
    { id: 'e2', title: 'New Customer Registered', desc: 'Priya S. signed up via Google OAuth', time: '18 mins ago', icon: UserPlus },
    { id: 'e3', title: '5-Star Review Received', desc: 'Rohan M. left a review on Single Origin Malabar Gold', time: '42 mins ago', icon: Star },
    { id: 'e4', title: 'Coupon Code Created', desc: 'ROAST15 (15% off) created by admin', time: '1 hour ago', icon: Tag },
  ];

  return (
    <div className="admin-page-container">
      <PageHeader
        title="Realtime Activity Feed"
        subtitle="Live stream of orders, customer registrations, reviews and admin events"
      />

      <div className="admin-card max-w-2xl space-y-6">
        <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-700" /> Recent Events Stream
        </h3>

        <div className="relative pl-6 space-y-6 border-l-2 border-amber-200">
          {events.map((e) => {
            const Icon = e.icon;
            return (
              <div key={e.id} className="relative">
                <div className="absolute -left-[31px] top-0 w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-amber-900">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-stone-900 text-sm">{e.title}</h4>
                    <span className="text-xs text-stone-400 font-mono">{e.time}</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">{e.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
