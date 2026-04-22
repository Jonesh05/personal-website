import ContactForm from './ContactForm.client';
import { CopyEmailCard } from './CopyEmailCard.client';
import { getServerTranslations } from '@/i18n/server';

const EMAIL = 'jopimiento@gmail.com';
const EMAIL_SUBJECT = "Let's connect";

export default async function Contact() {
  const { t } = await getServerTranslations('Contact');

  return (
    <section
      id="contact"
      className="relative py-28 overflow-hidden"
      aria-labelledby="contact-heading"
    >
      {/* Plasma blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="plasma-blob-a absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle at 60% 40%, #7C3AED 0%, #4C1D95 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="plasma-blob-b absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full opacity-15"
          style={{
            background:
              'radial-gradient(circle at 40% 60%, #00FFB2 0%, #059669 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">

        {/* ── Section header ── */}
        <header className="text-center mb-16">
          <p
            className="text-lg tracking-widest uppercase mb-3 pt-5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-green-neon)' }}
          >
            {t('section_label')}
          </p>
          <h2
            id="contact-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'var(--color-text)',
            }}
          >
            {t('heading_line1')}{' '}
            <span className="text-plasma">{t('heading_line2')}</span>
          </h2>
          <p
            className="mt-4 max-w-md mx-auto text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('subtitle')}
          </p>
        </header>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* Left column — email-first contact card */}
          <aside className="lg:col-span-2" aria-label={t('emailLabel')}>
            <CopyEmailCard
              email={EMAIL}
              subject={EMAIL_SUBJECT}
            />
          </aside>

          {/* Right column — full contact form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
