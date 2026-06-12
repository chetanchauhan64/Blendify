'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUp } from '@/lib/actions/auth';
import styles from './page.module.css';

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} />

      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.brand}>BLENDIFY</span>
          <h1 className={styles.title}>Create your account</h1>
          <p className={styles.subtitle}>Join the Blendify community and start brewing better</p>
        </div>

        {/* General error */}
        {state?.errors?.general && (
          <p className={styles.generalError}>{state.errors.general[0]}</p>
        )}

        {/* Form */}
        <form action={action} className={styles.form}>
          {/* Name row */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="firstName" className={styles.label}>First name</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Arjun"
                className={`${styles.input} ${state?.errors?.firstName ? styles.hasError : ''}`}
                required
              />
              {state?.errors?.firstName && (
                <p className={styles.fieldError}>{state.errors.firstName[0]}</p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="lastName" className={styles.label}>Last name</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Sharma"
                className={`${styles.input} ${state?.errors?.lastName ? styles.hasError : ''}`}
                required
              />
              {state?.errors?.lastName && (
                <p className={styles.fieldError}>{state.errors.lastName[0]}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={`${styles.input} ${state?.errors?.email ? styles.hasError : ''}`}
              required
            />
            {state?.errors?.email && (
              <p className={styles.fieldError}>{state.errors.email[0]}</p>
            )}
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className={`${styles.input} ${state?.errors?.password ? styles.hasError : ''}`}
              required
            />
            {state?.errors?.password && (
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {state.errors.password.map((e) => (
                  <li key={e} className={styles.fieldError}>{e}</li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={pending}>
            {pending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}>or</div>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link href="/sign-in">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
