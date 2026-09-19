'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import styles from './ProductAccordion.module.css';
import type { AccordionData } from '@/lib/data/iced-tea-profiles';

interface SectionItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface Props {
  data: AccordionData;
}

function AccordionSection({
  id,
  label,
  children,
  defaultOpen = false,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={styles.section}>
      <button
        type="button"
        id={`acc-btn-${id}`}
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`acc-panel-${id}`}
      >
        <span className={styles.triggerLabel}>{label}</span>
        <motion.span
          className={styles.chevron}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`acc-panel-${id}`}
            role="region"
            aria-labelledby={`acc-btn-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className={styles.panelInner}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProductAccordion({ data }: Props) {
  return (
    <div className={styles.wrapper}>
      {/* 1 — Description */}
      <AccordionSection id="desc" label="Description" defaultOpen>
        <div className={styles.prose}>
          {data.description.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </AccordionSection>

      {/* 2 — Ingredients */}
      <AccordionSection id="ingredients" label="Ingredients">
        <ul className={styles.bulletList}>
          {data.ingredients.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </AccordionSection>

      {/* 3 — What's Inside? */}
      <AccordionSection id="whats-inside" label="What's Inside?">
        <p className={styles.introText}>{data.whatsInside.intro}</p>
        <div className={styles.flavourList}>
          {data.whatsInside.items.map((item, i) => (
            <div key={i} className={styles.flavourItem}>
              <span className={styles.flavourName}>{item.flavour}</span>
              <p className={styles.flavourDesc}>{item.description}</p>
            </div>
          ))}
        </div>
      </AccordionSection>

      {/* 4 — What makes it different? */}
      <AccordionSection id="differentiators" label="What makes it different?">
        <ul className={styles.checkList}>
          {data.differentiators.map((item, i) => (
            <li key={i}>
              <span className={styles.checkIcon} aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </AccordionSection>

      {/* 5 — How to Make */}
      <AccordionSection id="how-to-make" label="How to Make">
        <ol className={styles.numberedList}>
          {data.howToMake.map((step, i) => (
            <li key={i}>
              <span className={styles.stepNum}>{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </AccordionSection>

      {/* 6 — FAQs (sub-accordion) */}
      <AccordionSection id="faqs" label="FAQs">
        <div className={styles.faqList}>
          {data.faqs.map((faq, i) => (
            <FAQItem key={i} index={i} question={faq.q} answer={faq.a} />
          ))}
        </div>
      </AccordionSection>
    </div>
  );
}

function FAQItem({
  index,
  question,
  answer,
}: {
  index: number;
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  const id = `faq-${index}`;

  return (
    <div className={styles.faqItem}>
      <button
        type="button"
        id={`faq-btn-${id}`}
        className={styles.faqQuestion}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`faq-panel-${id}`}
      >
        <span>{question}</span>
        <motion.span
          className={styles.faqChevron}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden="true"
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-panel-${id}`}
            role="region"
            aria-labelledby={`faq-btn-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <p className={styles.faqAnswer}>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
