'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle } from 'lucide-react';
import { slideUp, viewportConfig } from '@/lib/animations';
import styles from './Newsletter.module.css';

export function Newsletter() {
  const [email, setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // Simulate
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <motion.div
          className={styles.content}
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <span className="section-label">Newsletter</span>
          <h2 className={styles.heading}>Join The BLENDIFY Club</h2>
          <p className={styles.desc}>
            Get early access to new coffee drops, exclusive offers, and brewing tips.
            No spam. Just good coffee news.
          </p>

          {submitted ? (
            <div className={styles.success}>
              <CheckCircle size={24} className={styles.successIcon} />
              <span>You're in! Welcome to the BLENDIFY Club ☕</span>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="your@email.com"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email address"
              />
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? <span className={styles.spinner} /> : <><Send size={15} /> Subscribe</>}
              </button>
            </form>
          )}

          <p className={styles.fine}>Join 10,000+ coffee lovers. Unsubscribe anytime.</p>
        </motion.div>

        {/* Decorative emojis */}
        <div className={styles.decoEmojis} aria-hidden="true">
          {['☕', '🫘', '✨', '⚡', '🌱'].map((e, i) => (
            <motion.span
              key={i}
              className={styles.decoEmoji}
              animate={{ y: [0, -12, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
            >
              {e}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
