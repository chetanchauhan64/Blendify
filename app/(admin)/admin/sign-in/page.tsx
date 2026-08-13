// ============================================================
// BLENDIFY — /admin/sign-in
// Dedicated admin authentication page.
// Uses the existing signIn server action — no second auth system.
// After successful sign-in:
//   ADMIN / SUPER_ADMIN → /admin/dashboard
//   Any other role      → /account (with no admin access granted)
// ============================================================
'use client';

import { useActionState } from 'react';
import { signIn } from '@/lib/actions/auth';
import styles from './page.module.css';

export default function AdminSignInPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} />

      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoMark}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="rgba(88,19,18,0.1)" stroke="#581312" strokeWidth="1.5" />
              <path d="M13 20c0-4 3.5-7 7-7s7 3 7 7" stroke="#581312" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 26h20M14 30h12" stroke="#581312" strokeWidth="2" strokeLinecap="round" />
              <path d="M27 16c2 0 4 1 4 3s-2 3-4 3" stroke="#8B3030" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span className={styles.brand}>BLENDIFY</span>
          <h1 className={styles.title}>Admin Sign In</h1>
          <p className={styles.subtitle}>Sign in with your authorized administrator account</p>
        </div>

        {/* General error */}
        {state?.errors?.general && (
          <div className={styles.errorBanner} role="alert">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {state.errors.general[0]}
          </div>
        )}

        {/* Form */}
        <form action={action} className={styles.form} noValidate>
          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="admin-email" className={styles.label}>
              Email address
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              className={`${styles.input} ${state?.errors?.email ? styles.hasError : ''}`}
              required
              aria-describedby={state?.errors?.email ? 'admin-email-error' : undefined}
            />
            {state?.errors?.email && (
              <p id="admin-email-error" className={styles.fieldError}>
                {state.errors.email[0]}
              </p>
            )}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="admin-password" className={styles.label}>
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${styles.input} ${state?.errors?.password ? styles.hasError : ''}`}
              required
              aria-describedby={state?.errors?.password ? 'admin-password-error' : undefined}
            />
            {state?.errors?.password && (
              <p id="admin-password-error" className={styles.fieldError}>
                {state.errors.password[0]}
              </p>
            )}
          </div>

          <button
            id="admin-sign-in-submit"
            type="submit"
            className={styles.submitBtn}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign In to Admin'
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Not an administrator?{' '}
          <a href="/sign-in" className={styles.footerLink}>
            Customer sign in
          </a>
        </p>
      </div>
    </div>
  );
}
