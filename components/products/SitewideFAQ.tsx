'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './SitewideFAQ.module.css';
import { SITE_WIDE_FAQS } from '@/lib/data/iced-tea-profiles';
import type { FAQItem } from '@/lib/data/iced-tea-profiles';

function FAQRow({ faq, index }: { faq: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);
  const id = `swfaq-${index}`;

  return (
    <div className={styles.row}>
      <button
        type="button"
        id={`${id}-btn`}
        className={styles.question}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
      >
        <span>{faq.q}</span>
        <motion.span
          className={styles.chevron}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <ChevronDown size={17} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-btn`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className={styles.answer}>{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SitewideFAQ() {
  return (
    <section className={styles.section} aria-label="Frequently asked questions">
      <div className={styles.header}>
        <h2 className={styles.heading}>Frequently Asked Questions</h2>
        <p className={styles.subheading}>
          Everything you need to know about ordering, delivery, and Blendify products.
        </p>
      </div>
      <div className={styles.list}>
        {SITE_WIDE_FAQS.map((faq, i) => (
          <FAQRow key={i} faq={faq} index={i} />
        ))}
      </div>
    </section>
  );
}
