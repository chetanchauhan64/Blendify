'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { slideInLeft, slideInRight, viewportConfig } from '@/lib/animations';
import styles from './BrandStory.module.css';

export function BrandStory() {
  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.inner}`}>

        {/* Left — decorative */}
        <motion.div
          className={styles.visual}
          variants={slideInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <div className={styles.visualCard}>
            <div className={styles.bigEmoji}>☕</div>
            <div className={styles.floating1}>🌱</div>
            <div className={styles.floating2}>✦</div>
            <div className={styles.yearBadge}>
              <span className={styles.yearNum}>2021</span>
              <span className={styles.yearLabel}>Est.</span>
            </div>
          </div>
          <div className={styles.statCards}>
            <div className={styles.statCard}>
              <span className={styles.statBig}>50+</span>
              <span className={styles.statSm}>Flavours</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statBig}>10K+</span>
              <span className={styles.statSm}>Coffee Lovers</span>
            </div>
          </div>
        </motion.div>

        {/* Right — copy */}
        <motion.div
          className={styles.copy}
          variants={slideInRight}
          initial="hidden"
          whileInView="visible"
          viewport={viewportConfig}
        >
          <span className="section-label">Our Story</span>
          <h2 className={styles.heading}>
            Every Bean<br />Has A <em className={styles.accent}>Story</em>
          </h2>
          <div className={styles.body}>
            <p>
              BLENDIFY was born from a simple, frustrating truth — premium coffee shouldn't cost a fortune, come wrapped in pretentious jargon, or taste like corporate compromise.
            </p>
            <p>
              We craft for the builders, the late-night coders, the designers chasing deadlines, and the dreamers who need their first sip to mean something. Coffee for the bold.
            </p>
            <p>
              Every flavour, every bean, every bag carries one philosophy: <strong>refuse average.</strong>
            </p>
          </div>

          <div className={styles.pillars}>
            {['Quality First', 'Community Driven', 'India Rooted', 'Creativity Fuelled'].map((p) => (
              <span key={p} className={styles.pill}>{p}</span>
            ))}
          </div>

          <Link href="/about" className={`btn btn--primary btn--lg ${styles.cta}`}>
            Our Story <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
