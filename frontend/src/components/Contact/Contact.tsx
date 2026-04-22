import ContactForm from './ContactForm.client';

const EMAIL = 'jopimiento@gmail.com';

// Paths como strings — no JSX dentro de objetos (SWC/Turbopack Server Component safe)
const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com',
    d: 'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z',
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    d: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z',
  },
  {
    label: 'X / Twitter',
    href: 'https://x.com',
    d: 'M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z',
  },
];

export default function Contact() {
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
            background: 'radial-gradient(circle at 60% 40%, #7C3AED 0%, #4C1D95 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="plasma-blob-b absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle at 40% 60%, #00FFB2 0%, #059669 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">

        {/* ── Section header ── */}
        <div className="text-center mb-16">
          <p
            className="text-lg tracking-widest uppercase mb-3 pt-5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-green-neon)' }}
          >
            — Get In Touch
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
            Let&apos;s build something{' '}
            <span className="text-plasma">together</span>
          </h2>
          <p className="mt-4 max-w-md mx-auto text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Have a project in mind or just want to connect? Send a message and I&apos;ll get back to you.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

          {/* ── Left — quick contact box ── */}
          <aside className="lg:col-span-2 flex flex-col gap-4" aria-label="Quick contact options">

            {/* mailto box */}
            <div
              className="relative rounded-2xl p-6"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid rgba(124, 58, 237, 0.35)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              {/* Top stripe */}
              <div
                className="absolute top-0 inset-x-0 h-px rounded-t-2xl"
                style={{
                  background: 'linear-gradient(90deg, transparent, #7C3AED, #BF5EFF, transparent)',
                }}
                aria-hidden="true"
              />

              <p
                className="text-sm mb-4 leading-relaxed"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)' }}
              >
                Want to chat? Feel free to reach out
              </p>

              {/* Via Email — mailto link */}
              <a
                href={`mailto:${EMAIL}?subject=Hello%20Jhonny%20Let%E2%80%99s%20connect`}
                className="group flex  flex-wrap items-center gap-3 w-full rounded-xl px-4 py-3  text-left transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-1 hover:shadow-[0_20px_50px_-30px_rgba(8,145,178,0.5)] focus-visible:ring-2 focus-visible:outline-none dark:border-cyan-400/25 dark:bg-none dark:bg-cyan-950/50"
                style={{
                  background: 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                }}
                aria-label={`Send email to ${EMAIL}`}
              >
                {/* Envelope icon */}
                <span
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(191, 94, 255, 0.15)' }}
                  aria-hidden="true"
                >
                  <svg
                    width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.8"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ color: 'var(--color-purple-neon)' }}
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>

                <div className="flex flex-col text-left overflow-hidden">
                  <span style={{ color: 'var(--color-purple-neon)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Via Email
                  </span>
                </div>

                <div
                className="rounded-xl px-4 py-3 flex flex-col gap-2"
                >
                <p
                  className="text-sm font-semibold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
                >
                  Ask questions
                </p>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)' }}
                >
                  Explore collaboration opportunities
                </p>
                </div>
              </a>

              {/* Ask questions + collaboration */}
              
            </div>

            {/* Social links */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-faint)' }}
              >
                Find me on
              </p>
              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ label, href, d }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d={d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Right — form ── */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

        </div>
      </div>
    </section>
  );
}
