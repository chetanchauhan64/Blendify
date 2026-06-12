import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Coffee, Users, Heart, Zap } from 'lucide-react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'About | BLENDIFY',
  description: 'The story behind BLENDIFY — premium specialty coffee crafted for bold thinkers, creators, and coffee enthusiasts. The Art of Coffee.',
};

const PILLARS = [
  { icon: Coffee, title: 'Quality First',        desc: 'Every bean is hand-selected, every roast is obsessively dialled in. We refuse to compromise on taste.' },
  { icon: Users,  title: 'Community Driven',     desc: 'Built with and for our community. Your feedback shapes every new drop we launch.' },
  { icon: Heart,  title: 'India Rooted',         desc: 'Proudly made in India. We source from Indian estates and celebrate Indian coffee culture.' },
  { icon: Zap,    title: 'Creativity Fuelled',   desc: 'Made for makers. For the ones who create things the world hasn\'t seen yet. Coffee is your tool.' },
];

export default function AboutPage() {
  return (
    <main className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={`container ${styles.heroContent}`}>
          <span className="section-label">Our Story</span>
          <h1 className={styles.heroHeading}>
            Born Loud.<br />
            <em className={styles.accent}>Brewed Bold.</em>
          </h1>
          <p className={styles.heroSub}>
            We started BLENDIFY because we were tired of paying too much for mediocre coffee. So we obsessed over every bean, every roast, every sip. And then we couldn't stop.
          </p>
        </div>
        <div className={styles.heroBigEmoji} aria-hidden="true">☕</div>
      </section>

      {/* ── Brand Story ──────────────────────────────────── */}
      <section className={`section ${styles.story}`}>
        <div className={`container ${styles.storyGrid}`}>
          <div className={styles.storyNumbers}>
            {[
              { num: '2021', label: 'Founded' },
              { num: '50+',  label: 'Flavours' },
              { num: '10K+', label: 'Customers' },
              { num: '4.9★', label: 'Rating' },
            ].map((s) => (
              <div key={s.label} className={styles.storyNum}>
                <span className={styles.numBig}>{s.num}</span>
                <span className={styles.numLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.storyText}>
            <h2 className={styles.storyHeading}>Every Bean Has A Story</h2>
            <p>It started in a tiny Bengaluru apartment in 2021. Three friends, one broken coffee machine, and an absolute refusal to settle for bad coffee. We spent six months sourcing, roasting, and testing before we shipped our first bag. The brand became BLENDIFY.</p>
            <p>Today, BLENDIFY ships to every corner of India. Our community includes developers, designers, entrepreneurs, students, and anyone who believes that what you put in your cup reflects what you put into your work.</p>
            <p>We believe in transparency — in our sourcing, our roasting, and our business. When you buy from us, you know exactly what you're getting: <strong>the best coffee we've ever tasted, at a price that doesn't insult your intelligence.</strong></p>
          </div>
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────── */}
      <section className={`section--surface ${styles.mission}`}>
        <div className={`container ${styles.missionContent}`}>
          <span className="section-label">Our Mission</span>
          <h2 className={styles.missionHeading}>
            Make premium coffee <em className={styles.accent}>accessible</em> to every Indian.
          </h2>
          <p className={styles.missionSub}>
            Not just for the ones who can afford a ₹600 latte. For the student pulling an all-nighter. For the founder bootstrapping their dream. For the artist chasing inspiration at 2 AM. That's the BLENDIFY promise.
          </p>
        </div>
      </section>

      {/* ── Pillars ──────────────────────────────────────── */}
      <section className={`section ${styles.pillars}`}>
        <div className="container">
          <div className={styles.pillarsHeader}>
            <span className="section-label">Philosophy</span>
            <h2 className={`section-title`}>What We Stand For</h2>
          </div>
          <div className={styles.pillarsGrid}>
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className={styles.pillarCard}>
                <div className={styles.pillarIcon}><Icon size={24} /></div>
                <h3 className={styles.pillarTitle}>{title}</h3>
                <p className={styles.pillarDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coffee Philosophy ─────────────────────────────── */}
      <section className={`section--surface ${styles.philosophy}`}>
        <div className={`container ${styles.philoContent}`}>
          <div className={styles.philoEmoji} aria-hidden="true">🪴</div>
          <div>
            <span className="section-label">Coffee Philosophy</span>
            <h2 className={styles.philoHeading}>Coffee is Culture</h2>
            <p>For us, coffee is never just a beverage. It's a ritual, a community, a language. The way you take your coffee says something about the way you take on the world. BLENDIFY roasts for the ones who take it seriously.</p>
            <p>We work directly with Indian estates in Coorg, Chikmagalur, and Araku Valley — sourcing single-origin lots that most brands would never bother with. Because the bean tells the story, if you're willing to listen.</p>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className={`section ${styles.cta}`}>
        <div className={`container ${styles.ctaContent}`}>
          <span className={styles.ctaEmoji}>☕</span>
          <h2 className={styles.ctaHeading}>Ready to Spill?</h2>
          <p className={styles.ctaSub}>Explore our full collection and find your perfect cup.</p>
          <div className={styles.ctaActions}>
            <Link href="/shop" className="btn btn--primary btn--lg">
              Shop Collection <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="btn btn--outline btn--lg">
              Get in Touch
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
