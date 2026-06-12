'use client';

import { useState, useTransition } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { ProfileSchema } from '@/lib/validations/auth';
import type { UserDTO } from '@/types/auth';
import type { z } from 'zod';
import styles from './ProfileForm.module.css';

interface Props {
  user: UserDTO;
}

type FormErrors = Partial<Record<keyof z.infer<typeof ProfileSchema>, string>>;

export function ProfileForm({ user }: Props) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccess(false);

    const parsed = ProfileSchema.safeParse({
      ...form,
      phone: form.phone || null,
    });

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
      try {
        const res = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          setServerError(json.error ?? 'Something went wrong. Please try again.');
          return;
        }

        setSuccess(true);
      } catch {
        setServerError('Network error. Please check your connection.');
      }
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="firstName" className={styles.label}>First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            className={`input ${errors.firstName ? styles.inputError : ''}`}
            value={form.firstName}
            onChange={handleChange}
            autoComplete="given-name"
          />
          {errors.firstName && <p className={styles.errorMsg}>{errors.firstName}</p>}
        </div>

        <div className={styles.field}>
          <label htmlFor="lastName" className={styles.label}>Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            className={`input ${errors.lastName ? styles.inputError : ''}`}
            value={form.lastName}
            onChange={handleChange}
            autoComplete="family-name"
          />
          {errors.lastName && <p className={styles.errorMsg}>{errors.lastName}</p>}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>Email <span className={styles.readOnly}>(managed by Clerk)</span></label>
        <input
          id="email"
          type="email"
          className="input"
          value={user.email}
          disabled
          aria-disabled="true"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="phone" className={styles.label}>Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className={`input ${errors.phone ? styles.inputError : ''}`}
          value={form.phone}
          onChange={handleChange}
          placeholder="+91 98765 43210"
          autoComplete="tel"
        />
        {errors.phone && <p className={styles.errorMsg}>{errors.phone}</p>}
      </div>

      {serverError && <p className={styles.serverError}>{serverError}</p>}
      {success && <p className={styles.successMsg}>✓ Profile updated successfully</p>}

      <div className={styles.actions}>
        <button
          type="submit"
          className="btn btn--primary"
          disabled={isPending}
          id="save-profile-btn"
        >
          {isPending ? (
            <><Loader2 size={16} className={styles.spin} /> Saving…</>
          ) : (
            <><Save size={16} /> Save Changes</>
          )}
        </button>
      </div>
    </form>
  );
}
