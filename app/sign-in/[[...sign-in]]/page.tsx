'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signIn } from '@/lib/actions/auth';
import styles from './page.module.css';

export default function SignInPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <div className={styles.page}>
      <div className={styles.backdrop} />

      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.brand}>BLENDIFY</span>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to your account to continue</p>
        </div>

        {/* General error */}
        {state?.errors?.general && (
          <p className={styles.generalError}>{state.errors.general[0]}</p>
        )}

        {/* Form */}
        <form action={action} className={styles.form}>
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
              autoComplete="current-password"
              placeholder="••••••••"
              className={`${styles.input} ${state?.errors?.password ? styles.hasError : ''}`}
              required
            />
            {state?.errors?.password && (
              <p className={styles.fieldError}>{state.errors.password[0]}</p>
            )}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={pending}>
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className={styles.divider}>or</div>

        <p className={styles.footer}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up">Create one</Link>
        </p>
      </div>
    </div>
  );
}
