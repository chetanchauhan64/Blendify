// ============================================================
// SPILL THE BEANS — Framer Motion Animation Variants
// Reusable animation presets for the homepage
// ============================================================

import type { Variants } from 'framer-motion';

// ── Fade In ───────────────────────────────────────────────────
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Slide Up ──────────────────────────────────────────────────
export const slideUp: Variants = {
  hidden:  { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Slide Down ────────────────────────────────────────────────
export const slideDown: Variants = {
  hidden:  { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Slide In Left ─────────────────────────────────────────────
export const slideInLeft: Variants = {
  hidden:  { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Slide In Right ────────────────────────────────────────────
export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Stagger Container ─────────────────────────────────────────
export const staggerContainer: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren:   0.1,
    },
  },
};

// ── Stagger Container (Fast) ──────────────────────────────────
export const staggerFast: Variants = {
  hidden:  {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren:   0.05,
    },
  },
};

// ── Scroll Reveal ─────────────────────────────────────────────
export const scrollReveal: Variants = {
  hidden:  { opacity: 0, y: 60, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

// ── Scale In ──────────────────────────────────────────────────
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
  },
};

// ── Page Transition ───────────────────────────────────────────
export const pageTransition: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 },
  },
};

// ── Hover Scale ───────────────────────────────────────────────
export const hoverScale = {
  scale: 1.03,
  transition: { duration: 0.25, ease: 'easeOut' as const },
};

// ── Hover Lift ────────────────────────────────────────────────
export const hoverLift = {
  y: -6,
  transition: { duration: 0.25, ease: 'easeOut' as const },
};

// ── Image Zoom ────────────────────────────────────────────────
export const imageZoom: Variants = {
  rest:  { scale: 1,    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  hover: { scale: 1.08, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// ── Viewport config helper ────────────────────────────────────
export const viewportConfig = {
  once:   true,
  amount: 0.15,
} as const;
