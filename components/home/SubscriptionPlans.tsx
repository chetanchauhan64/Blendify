'use client';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import styles from './SubscriptionPlans.module.css';

interface Plan { id: string; name: string; frequency: string; discount: number; perks: string[]; popular: boolean; }

export function SubscriptionPlans({ plans }: { plans: Plan[] }) {
  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <motion.div className={styles.header} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <span className="section-label">Never Run Out</span>
          <h2 className="section-title">Subscribe & Save</h2>
          <p className="section-subtitle">Fresh coffee delivered on your schedule. Pause or cancel anytime — no questions asked.</p>
        </motion.div>

        <div className={styles.grid}>
          {plans.map((plan, i) => (
            <motion.div key={plan.id} className={`${styles.card} ${plan.popular ? styles.cardPopular : ''}`} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}>
              {plan.popular && (
                <div className={styles.popularBadge}>
                  <Zap size={12} fill="currentColor" /> Most Popular
                </div>
              )}
              <div className={styles.cardTop}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <div className={styles.discount}>
                  <span className={styles.discountValue}>{plan.discount}%</span>
                  <span className={styles.discountLabel}>off every order</span>
                </div>
              </div>
              <ul className={styles.perks}>
                {plan.perks.map((perk) => (
                  <li key={perk} className={styles.perk}>
                    <Check size={14} className={styles.checkIcon} />
                    {perk}
                  </li>
                ))}
              </ul>
              <button id={`subscribe-${plan.id}`} className={`btn ${plan.popular ? 'btn--primary' : 'btn--outline'} ${styles.btn}`}>
                Subscribe {plan.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
