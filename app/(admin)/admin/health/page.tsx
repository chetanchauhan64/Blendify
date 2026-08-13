// ============================================================
// BLENDIFY — Admin Module: System Health Dashboard
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { StatCard } from '@/components/admin/ui/StatCard';
import { HeartPulse, Database, HardDrive, Cpu, ShieldCheck } from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  services: {
    database: { status: string; latencyMs: number; type: string };
    storage: { status: string; provider: string; usedMb: number };
    redis: { status: string; connectedClients: number };
    emailService: { status: string; provider: string };
  };
  system: {
    nodeVersion: string;
    uptimeSeconds: number;
    memoryMb: { rss: number; heapTotal: number; heapUsed: number };
    cpuUsagePercent: number;
  };
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/health');
      const json = await res.json();
      if (json.success && json.data) {
        setHealth(json.data);
      }
    } catch (err) {
      console.error('Failed to load health status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="admin-page-container">
      <PageHeader
        title="System Health & Realtime Status"
        subtitle="Live metrics for PostgreSQL DB, Cloudinary storage, Node.js memory, CPU load & background services"
        actionLabel="Refresh Health"
        onAction={fetchHealth}
      />

      {loading && !health ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="admin-card animate-pulse h-28" />
          <div className="admin-card animate-pulse h-28" />
          <div className="admin-card animate-pulse h-28" />
          <div className="admin-card animate-pulse h-28" />
        </div>
      ) : health ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              label="Overall System Status"
              value="HEALTHY"
              icon={<HeartPulse size={18} />}
              trend={100}
              trendLabel="Uptime"
            />
            <StatCard
              label="Database Latency"
              value={`${health.services.database.latencyMs} ms`}
              icon={<Database size={18} />}
              trendLabel="PostgreSQL 15"
            />
            <StatCard
              label="Node.js Heap Memory"
              value={`${health.system.memoryMb.heapUsed} MB`}
              icon={<HardDrive size={18} />}
              trendLabel={`Total ${health.system.memoryMb.heapTotal} MB`}
            />
            <StatCard
              label="CPU Process Load"
              value={`${health.system.cpuUsagePercent}%`}
              icon={<Cpu size={18} />}
              trendLabel="Normal Load"
            />
          </div>

          <div className="admin-card space-y-4">
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700" /> Infrastructure Service Health
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 border rounded-xl flex justify-between items-center bg-stone-50">
                <div>
                  <h4 className="font-bold text-stone-900">PostgreSQL Primary DB</h4>
                  <p className="text-stone-500">{health.services.database.type}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {health.services.database.status}
                </span>
              </div>

              <div className="p-3 border rounded-xl flex justify-between items-center bg-stone-50">
                <div>
                  <h4 className="font-bold text-stone-900">Cloudinary CDN Media Storage</h4>
                  <p className="text-stone-500">Used: {health.services.storage.usedMb} MB</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {health.services.storage.status}
                </span>
              </div>

              <div className="p-3 border rounded-xl flex justify-between items-center bg-stone-50">
                <div>
                  <h4 className="font-bold text-stone-900">Resend Transactional Email Engine</h4>
                  <p className="text-stone-500">SMTP / REST API</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {health.services.emailService.status}
                </span>
              </div>

              <div className="p-3 border rounded-xl flex justify-between items-center bg-stone-50">
                <div>
                  <h4 className="font-bold text-stone-900">Upstash Redis In-Memory Cache</h4>
                  <p className="text-stone-500">Connected Clients: {health.services.redis.connectedClients}</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full capitalize">
                  {health.services.redis.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
