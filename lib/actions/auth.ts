// ============================================================
// BLENDIFY — lib/actions/auth.ts
// Server Actions for sign-in, sign-up, sign-out
// Uses Jose JWT sessions + bcrypt password hashing
// ============================================================
'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/lib/session';
import { isDbConfigured } from '@/lib/db/prisma';

// ── Zod Schemas ───────────────────────────────────────────────

const SignUpSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }).trim(),
  lastName: z.string().min(1, { message: 'Last name is required.' }).trim(),
  email: z.string().email({ message: 'Please enter a valid email address.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
});

const SignInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }),
});

// ── Action State Types ────────────────────────────────────────

export type AuthFormState =
  | {
      errors?: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        password?: string[];
        general?: string[];
      };
      message?: string;
    }
  | undefined;


// ── Sign Up ───────────────────────────────────────────────────

/**
 * Server Action: Register a new user.
 * If DATABASE_URL is set, saves to Prisma. Otherwise creates a mock session.
 */
export async function signUp(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const raw = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const validated = SignUpSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { firstName, lastName, email, password } = validated.data;
  const hashedPassword = await bcrypt.hash(password, 12);

  let userId: string;

  if (isDbConfigured) {
    try {
      const { prisma } = await import('@/lib/db/prisma');

      // Check for duplicate email
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return { errors: { email: ['An account with this email already exists.'] } };
      }

      const user = await (prisma.user.create as (args: unknown) => Promise<{ id: string }>)({
        data: { email, firstName, lastName, password: hashedPassword, role: 'CUSTOMER' },
      });
      userId = user.id;
    } catch (err) {
      console.error('[signUp]', err);
      return { errors: { general: ['Something went wrong. Please try again.'] } };
    }
  } else {
    // No DB — create a demo session so the UI still works locally
    userId = `demo_${Date.now()}`;
  }

  await createSession({ userId, email, firstName, lastName, role: 'CUSTOMER' });
  redirect('/account');
}

// ── Sign In ───────────────────────────────────────────────────

/**
 * Server Action: Authenticate an existing user.
 */
export async function signIn(
  state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const validated = SignInSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  if (isDbConfigured) {
    try {
      const { prisma } = await import('@/lib/db/prisma');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const user = await prisma.user.findUnique({ where: { email } }) as any;
      if (!user || !user.password) {
        return { errors: { general: ['Invalid email or password.'] } };
      }

      const passwordMatch = await bcrypt.compare(password, user.password as string);
      if (!passwordMatch) {
        return { errors: { general: ['Invalid email or password.'] } };
      }

      await createSession({
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as 'CUSTOMER' | 'ADMIN',
      });
    } catch (err) {
      console.error('[signIn]', err);
      return { errors: { general: ['Something went wrong. Please try again.'] } };
    }
  } else {
    // No DB — demo mode: accept any credentials
    await createSession({
      userId: `demo_${Date.now()}`,
      email,
      firstName: 'Demo',
      lastName: 'User',
      role: 'CUSTOMER',
    });
  }

  redirect('/account');
}

// ── Sign Out ──────────────────────────────────────────────────

/**
 * Server Action: Delete session cookie and redirect to home.
 */
export async function signOut(): Promise<void> {
  await deleteSession();
  redirect('/');
}
