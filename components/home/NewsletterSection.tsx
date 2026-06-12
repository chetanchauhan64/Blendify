'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import styles from './NewsletterSection.module.css';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section className={`section ${styles.section}`}>
      <div className="container container--narrow">
        <motion.div
          className={styles.inner}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.iconWrapper}>
            <Mail size={32} />
          </div>
          <span className="section-label" style={{ textAlign: 'center', display: 'block' }}>Stay Connected</span>
          <h2 className={styles.title}>Join the BLENDIFY Inner Circle</h2>
          <p className={styles.subtitle}>
            Early access to new releases, exclusive subscriber offers, brewing guides, and the stories behind every cup.
          </p>

          {!submitted ? (
            <form className={styles.form} onSubmit={handleSubmit} aria-label="Newsletter signup">
              <div className={styles.inputWrapper}>
                <input
                  id="newsletter-email"
                  type="email"
                  className={`input ${styles.input}`}
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email address"
                />
                <button type="submit" id="newsletter-submit" className={`btn btn--primary ${styles.submitBtn}`}>
                  Subscribe <ArrowRight size={16} />
                </button>
              </div>
              <p className={styles.disclaimer}>No spam. Unsubscribe anytime. Coffee guaranteed.</p>
            </form>
          ) : (
            <motion.div
              className={styles.success}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className={styles.successIcon}>✦</div>
              <h3 className={styles.successTitle}>You&apos;re in the circle.</h3>
              <p className={styles.successText}>Thank you for joining. Expect something beautiful in your inbox soon.</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
