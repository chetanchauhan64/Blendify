import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Phone, MapPin, Share2, Link2, MessageCircle, ChevronDown } from 'lucide-react';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact | BLENDIFY',
  description: 'Get in touch with BLENDIFY. We\'d love to hear from you — for orders, wholesale, collaborations, or just to chat about coffee.',
};

const FAQS = [
  { q: 'How long does delivery take?',         a: 'Standard delivery takes 3–5 business days. Express delivery (1–2 days) is available for select pincodes.' },
  { q: 'Do you ship across India?',             a: 'Yes! We ship pan-India. Free shipping on orders above ₹999.' },
  { q: 'Can I return or exchange a product?',   a: 'We accept returns within 7 days for sealed, unopened products. Opened products are non-returnable due to food safety.' },
  { q: 'Do you offer bulk or wholesale orders?', a: 'Yes — we love working with offices, cafes, and co-working spaces. Email us at wholesale@spillthebeans.in.' },
  { q: 'Are your products FSSAI certified?',    a: 'Absolutely. All our products are FSSAI approved and USDA Organic certified.' },
];

export default function ContactPage() {
  return (
    <main className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={`container ${styles.heroContent}`}>
          <span className="section-label">Get In Touch</span>
          <h1 className={styles.heroHeading}>Let's Talk Coffee ☕</h1>
          <p className={styles.heroSub}>We're real humans who actually reply. Drop us a message, ask a question, or just tell us how you take your coffee.</p>
        </div>
      </section>

      {/* ── Main content ─────────────────────────────────── */}
      <section className={`section ${styles.main}`}>
        <div className={`container ${styles.grid}`}>

          {/* Contact form */}
          <div className={styles.formSide}>
            <h2 className={styles.formTitle}>Send a Message</h2>
            <form className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label className="label" htmlFor="contact-name">Name</label>
                  <input id="contact-name" type="text" placeholder="Your name" className="input" required />
                </div>
                <div className={styles.field}>
                  <label className="label" htmlFor="contact-email">Email</label>
                  <input id="contact-email" type="email" placeholder="your@email.com" className="input" required />
                </div>
              </div>
              <div className={styles.field}>
                <label className="label" htmlFor="contact-subject">Subject</label>
                <select id="contact-subject" className={`input ${styles.select}`}>
                  <option value="">Select a topic…</option>
                  <option value="order">Order / Delivery Issue</option>
                  <option value="product">Product Query</option>
                  <option value="wholesale">Wholesale Enquiry</option>
                  <option value="collab">Collaboration</option>
                  <option value="other">Just Saying Hi ☕</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className="label" htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  placeholder="Tell us what's on your mind…"
                  className={`input ${styles.textarea}`}
                  rows={5}
                  required
                />
              </div>
              <button type="submit" className="btn btn--primary btn--lg" style={{ width: '100%' }}>
                Send Message
              </button>
            </form>
          </div>

          {/* Info sidebar */}
          <div className={styles.infoSide}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Contact Details</h3>
              <div className={styles.infoItems}>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}><Mail size={18} /></div>
                  <div>
                    <div className={styles.infoLabel}>Email Us</div>
                    <a href="mailto:hello@blendify.coffee" className={styles.infoValue}>hello@blendify.coffee</a>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}><Phone size={18} /></div>
                  <div>
                    <div className={styles.infoLabel}>Call Us</div>
                    <a href="tel:+919876543210" className={styles.infoValue}>+91 98765 43210</a>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}><MessageCircle size={18} /></div>
                  <div>
                    <div className={styles.infoLabel}>WhatsApp</div>
                    <a href="https://wa.me/919876543210" className={styles.infoValue}>Chat with Us</a>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}><MapPin size={18} /></div>
                  <div>
                    <div className={styles.infoLabel}>Headquarters</div>
                    <span className={styles.infoValue}>Bengaluru, Karnataka 560001</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Follow BLENDIFY</h3>
              <div className={styles.socialLinks}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <Share2 size={18} /> @blendify.coffee
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <Link2 size={18} /> @blendifycoffee
                </a>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.hours}>
                <h3 className={styles.infoTitle}>Response Time</h3>
                <p className={styles.hoursText}>📩 Email — Within 24 hours<br />📞 Phone — Mon–Sat, 10 AM – 6 PM<br />💬 WhatsApp — Typically within 2 hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className={`section--surface ${styles.faq}`}>
        <div className="container">
          <div className={styles.faqHeader}>
            <span className="section-label">FAQ</span>
            <h2 className="section-title">Quick Answers</h2>
            <p className="section-subtitle">The most common questions we get. Got more? Just ask.</p>
          </div>
          <div className={styles.faqList}>
            {FAQS.map((item, i) => (
              <details key={i} className={styles.faqItem}>
                <summary className={styles.faqQ}>
                  {item.q}
                  <ChevronDown size={16} className={styles.faqChevron} />
                </summary>
                <p className={styles.faqA}>{item.a}</p>
              </details>
            ))}
          </div>
          <div className={styles.faqCta}>
            <p>Still have questions?</p>
            <a href="mailto:hello@blendify.coffee" className={styles.contactItem}>
              <Mail size={13} />
              hello@blendify.coffee
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
