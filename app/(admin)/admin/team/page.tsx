// ============================================================
// BLENDIFY — Admin Module: Team Members
// ============================================================
'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Users2, Plus, Edit2, Trash2, Search, Save } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  designation: string;
  bio: string;
  photoUrl: string;
  instagram: string;
  linkedin: string;
}

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([
    { id: 't1', name: 'Aarav Sharma', designation: 'Head Roaster & Q-Grader', bio: 'Aarav has 12 years experience cupping coffee across Chikmagalur & Coorg.', photoUrl: '/images/team-1.jpg', instagram: '', linkedin: '' },
    { id: 't2', name: 'Riya Sen', designation: 'Master Blender', bio: 'Riya formulates seasonal signature roasts and single-origin profiles.', photoUrl: '/images/team-2.jpg', instagram: '', linkedin: '' },
  ]);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Roastery Team Members"
        subtitle="Manage master roasters, Q-graders & leadership profiles displayed on About Us page"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {team.map((m) => (
          <div key={m.id} className="admin-card flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-900 text-lg flex-shrink-0">
              {m.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-base">{m.name}</h4>
              <span className="text-xs text-amber-800 font-semibold block">{m.designation}</span>
              <p className="text-xs text-stone-500 mt-1">{m.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
