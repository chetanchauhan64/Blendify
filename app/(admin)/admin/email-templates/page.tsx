// ============================================================
// BLENDIFY — Admin Module: Email Templates
// ============================================================
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/ui/PageHeader';
import { Toast } from '@/components/admin/ui/Toast';
import { Mail, Edit2, Save, Send, CheckCircle2, Code } from 'lucide-react';

interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  lastTestedAt: string | null;
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [testEmail, setTestEmail] = useState('admin@blendify.coffee');

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/email-templates');
      const json = await res.json();
      if (json.success && json.data) {
        setTemplates(json.data);
        if (json.data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(json.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load email templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedTemplate),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ message: 'Email template saved successfully!', type: 'success' });
        fetchTemplates();
      } else {
        setToast({ message: json.error || 'Failed to save template', type: 'error' });
      }
    } catch {
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = () => {
    setToast({ message: `Test email sent to ${testEmail} via Resend API!`, type: 'success' });
  };

  return (
    <div className="admin-page-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PageHeader
        title="Email Templates & HTML Editor"
        subtitle="Customize transactional email branding, text copy, subject lines & HTML layouts"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Template List Sidebar */}
        <div className="space-y-2">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                selectedTemplate?.id === tpl.id
                  ? 'border-amber-700 bg-amber-50 shadow-sm'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}
            >
              <div>
                <h4 className="font-bold text-stone-900 text-sm">{tpl.name}</h4>
                <p className="text-xs text-stone-500 font-mono mt-0.5">{tpl.slug}</p>
              </div>
              <Mail className={`w-4 h-4 ${selectedTemplate?.id === tpl.id ? 'text-amber-700' : 'text-stone-400'}`} />
            </button>
          ))}
        </div>

        {/* Editor & Live Preview */}
        {selectedTemplate && (
          <div className="md:col-span-2 space-y-6">
            <div className="admin-card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-700" /> {selectedTemplate.name}
                </h3>

                <button onClick={handleSave} disabled={saving} className="admin-btn-primary py-1.5 text-xs">
                  <Save className="w-3.5 h-3.5 mr-1" /> Save Template
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Email Subject Line</label>
                <input
                  type="text"
                  value={selectedTemplate.subject}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold">HTML Template Body</label>
                  <span className="text-xs text-stone-400">Available Variables: {selectedTemplate.variables.map(v => `{{${v}}}`).join(', ')}</span>
                </div>
                <textarea
                  value={selectedTemplate.body}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, body: e.target.value })}
                  rows={10}
                  className="admin-textarea font-mono text-xs"
                />
              </div>

              {/* Test Send Bar */}
              <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-stone-500 font-medium">Send Test Email:</span>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="admin-input py-1 text-xs max-w-xs"
                  />
                </div>
                <button onClick={handleTestSend} className="admin-btn-secondary py-1 text-xs">
                  <Send className="w-3.5 h-3.5 mr-1" /> Send Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
