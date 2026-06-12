// ============================================================
// BLENDIFY — Zod Validation Schemas
// Auth, profile, and address validation
// ============================================================

import { z } from 'zod';

// ── Profile Schema ────────────────────────────────────────────

export const ProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less')
    .trim(),
  phone: z
    .string()
    .regex(/^(\+\d{1,3}[\s-]?)?\d{6,14}$/, 'Please enter a valid phone number')
    .nullish()
    .transform((v) => v ?? null),
});

export type ProfileInput = z.infer<typeof ProfileSchema>;

// ── Address Schema ────────────────────────────────────────────

export const AddressSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be 50 characters or less')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be 50 characters or less')
    .trim(),
  company: z.string().max(100).nullish().transform((v) => v ?? null),
  phone: z
    .string()
    .regex(/^(\+\d{1,3}[\s-]?)?\d{6,14}$/, 'Please enter a valid phone number')
    .trim(),
  line1: z
    .string()
    .min(1, 'Address line 1 is required')
    .max(200, 'Address line 1 must be 200 characters or less')
    .trim(),
  line2: z
    .string()
    .max(200, 'Address line 2 must be 200 characters or less')
    .nullish()
    .transform((v) => v ?? null),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be 100 characters or less')
    .trim(),
  state: z
    .string()
    .min(1, 'State is required')
    .max(100, 'State must be 100 characters or less')
    .trim(),
  postalCode: z
    .string()
    .regex(/^\d{4,10}$/, 'Please enter a valid postal code')
    .trim(),
  countryId: z.string().min(1, 'Country is required'),
  type: z.enum(['HOME', 'WORK', 'OTHER']).default('HOME'),
  isDefault: z.boolean().default(false),
  label: z.string().max(50).nullish().transform((v) => v ?? null),
});

export type AddressInput = z.infer<typeof AddressSchema>;

// ── Webhook Payload ───────────────────────────────────────────

export const ClerkUserCreatedSchema = z.object({
  id: z.string(),
  email_addresses: z.array(
    z.object({
      email_address: z.string().email(),
      id: z.string(),
    }),
  ),
  primary_email_address_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  image_url: z.string().nullable(),
  phone_numbers: z.array(
    z.object({
      phone_number: z.string(),
    }),
  ).optional(),
});

export type ClerkUserCreated = z.infer<typeof ClerkUserCreatedSchema>;
