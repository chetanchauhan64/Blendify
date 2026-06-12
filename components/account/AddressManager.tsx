'use client';

import { useState, useTransition, useCallback } from 'react';
import { Plus, Edit2, Trash2, Star, Loader2, Home, Briefcase, MapPin } from 'lucide-react';
import { AddressSchema } from '@/lib/validations/auth';
import type { AddressDTO } from '@/types/auth';
import type { z } from 'zod';
import styles from './AddressManager.module.css';

interface Props {
  initialAddresses: AddressDTO[];
}

type AddressInput = z.infer<typeof AddressSchema>;
type FormErrors = Partial<Record<keyof AddressInput, string>>;

const EMPTY_FORM: AddressInput = {
  firstName: '',
  lastName: '',
  company: null,
  phone: '',
  line1: '',
  line2: null,
  city: '',
  state: '',
  postalCode: '',
  countryId: 'IN', // default country ID — adjust to real ID from your DB
  type: 'HOME',
  isDefault: false,
  label: null,
};

const TYPE_ICONS = { HOME: Home, WORK: Briefcase, OTHER: MapPin };

export function AddressManager({ initialAddresses }: Props) {
  const [addresses, setAddresses] = useState<AddressDTO[]>(initialAddresses);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Form handlers ─────────────────────────────────────────
  const openNew = () => { setForm(EMPTY_FORM); setEditingId(null); setErrors({}); setShowForm(true); };
  const openEdit = (addr: AddressDTO) => {
    setForm({
      firstName: addr.firstName,
      lastName: addr.lastName,
      company: addr.company ?? null,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? null,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      countryId: addr.countryId,
      type: addr.type,
      isDefault: addr.isDefault,
      label: addr.label ?? null,
    });
    setEditingId(addr.id);
    setErrors({});
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setErrors({}); };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setForm((p) => ({ ...p, [name]: checked !== undefined ? checked : value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  // ── Submit (create or update) ─────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = AddressSchema.safeParse({ ...form, line2: form.line2 || null });
    if (!parsed.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      const url = editingId ? `/api/addresses/${editingId}` : '/api/addresses';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (json.success) {
        if (editingId) {
          setAddresses((p) => p.map((a) => (a.id === editingId ? json.data : a)));
        } else {
          // If new default, clear old defaults
          setAddresses((p) => {
            const updated = json.data.isDefault ? p.map((a) => ({ ...a, isDefault: false })) : p;
            return [json.data, ...updated];
          });
        }
        closeForm();
      }
    });
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
    startTransition(async () => {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) setAddresses((p) => p.filter((a) => a.id !== id));
      setDeletingId(null);
    });
  }, []);

  // ── Set Default ───────────────────────────────────────────
  const handleSetDefault = useCallback((addr: AddressDTO) => {
    startTransition(async () => {
      const res = await fetch(`/api/addresses/${addr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...addr, line2: addr.line2 ?? null, isDefault: true }),
      });
      const json = await res.json();
      if (json.success) {
        setAddresses((p) => p.map((a) => ({ ...a, isDefault: a.id === addr.id })));
      }
    });
  }, []);

  return (
    <div className={styles.wrapper}>
      {/* Header row */}
      <div className={styles.topBar}>
        <p className={styles.count}>{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</p>
        <button id="add-address-btn" className="btn btn--primary" onClick={openNew}>
          <Plus size={16} /> Add Address
        </button>
      </div>

      {/* Address cards */}
      {addresses.length === 0 && !showForm && (
        <div className={styles.empty}>
          <MapPin size={40} strokeWidth={1.5} />
          <p>No saved addresses yet.</p>
          <button className="btn btn--primary" onClick={openNew}><Plus size={16} /> Add your first address</button>
        </div>
      )}

      <div className={styles.grid}>
        {addresses.map((addr) => {
          const Icon = TYPE_ICONS[addr.type] ?? MapPin;
          return (
            <div key={addr.id} className={`${styles.card} ${addr.isDefault ? styles.cardDefault : ''}`}>
              {addr.isDefault && <span className={styles.defaultBadge}><Star size={10} fill="currentColor" /> Default</span>}
              <div className={styles.cardHeader}>
                <Icon size={16} className={styles.typeIcon} />
                <span className={styles.addressType}>{addr.type}</span>
              </div>
              <p className={styles.addrName}>{addr.firstName} {addr.lastName}</p>
              <p className={styles.addrPhone}>{addr.phone}</p>
              <p className={styles.addrLine}>
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}
              </p>
              <p className={styles.addrLine}>{addr.city}, {addr.state} — {addr.postalCode}</p>
              <p className={styles.addrLine}>{addr.countryId}</p>

              <div className={styles.cardActions}>
                {!addr.isDefault && (
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleSetDefault(addr)}
                    disabled={isPending}
                  >
                    <Star size={14} /> Set Default
                  </button>
                )}
                <button className={styles.actionBtn} onClick={() => openEdit(addr)}>
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={() => handleDelete(addr.id)}
                  disabled={deletingId === addr.id}
                >
                  {deletingId === addr.id ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} />}
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Address Form Modal */}
      {showForm && (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && closeForm()}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editingId ? 'Edit Address' : 'Add Address'}>
            <h2 className={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add New Address'}</h2>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="addr-fname" className={styles.label}>First Name</label>
                  <input id="addr-fname" name="firstName" type="text" className={`input ${errors.firstName ? styles.inputError : ''}`} value={form.firstName} onChange={handleChange} />
                  {errors.firstName && <p className={styles.errorMsg}>{errors.firstName}</p>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="addr-lname" className={styles.label}>Last Name</label>
                  <input id="addr-lname" name="lastName" type="text" className={`input ${errors.lastName ? styles.inputError : ''}`} value={form.lastName} onChange={handleChange} />
                  {errors.lastName && <p className={styles.errorMsg}>{errors.lastName}</p>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="addr-phone" className={styles.label}>Phone</label>
                  <input id="addr-phone" name="phone" type="tel" className={`input ${errors.phone ? styles.inputError : ''}`} value={form.phone} onChange={handleChange} />
                  {errors.phone && <p className={styles.errorMsg}>{errors.phone}</p>}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="addr-line1" className={styles.label}>Address Line 1</label>
                <input id="addr-line1" name="line1" type="text" className={`input ${errors.line1 ? styles.inputError : ''}`} value={form.line1} onChange={handleChange} />
                {errors.line1 && <p className={styles.errorMsg}>{errors.line1}</p>}
              </div>

              <div className={styles.field}>
                <label htmlFor="addr-line2" className={styles.label}>Address Line 2 <span className={styles.optional}>(optional)</span></label>
                <input id="addr-line2" name="line2" type="text" className="input" value={form.line2 ?? ''} onChange={handleChange} />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="addr-city" className={styles.label}>City</label>
                  <input id="addr-city" name="city" type="text" className={`input ${errors.city ? styles.inputError : ''}`} value={form.city} onChange={handleChange} />
                  {errors.city && <p className={styles.errorMsg}>{errors.city}</p>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="addr-state" className={styles.label}>State</label>
                  <input id="addr-state" name="state" type="text" className={`input ${errors.state ? styles.inputError : ''}`} value={form.state} onChange={handleChange} />
                  {errors.state && <p className={styles.errorMsg}>{errors.state}</p>}
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label htmlFor="addr-postal" className={styles.label}>Postal Code</label>
                  <input id="addr-postal" name="postalCode" type="text" className={`input ${errors.postalCode ? styles.inputError : ''}`} value={form.postalCode} onChange={handleChange} />
                  {errors.postalCode && <p className={styles.errorMsg}>{errors.postalCode}</p>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="addr-type" className={styles.label}>Address Type</label>
                  <select id="addr-type" name="type" className="input" value={form.type} onChange={handleChange}>
                    <option value="HOME">Home</option>
                    <option value="WORK">Work</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <label className={styles.checkboxLabel}>
                <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} className={styles.checkbox} />
                Set as default delivery address
              </label>

              <div className={styles.formActions}>
                <button type="button" className="btn btn--ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" id="save-address-btn" className="btn btn--primary" disabled={isPending}>
                  {isPending ? <><Loader2 size={16} className={styles.spin} /> Saving…</> : (editingId ? 'Update Address' : 'Save Address')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
