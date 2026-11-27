'use client';

// Interactive bits of the BlogSidebar newsletter widget. Allows readers to
// subscribe and choose reading segmentation tags (`web3`, `ai`, `cybersecurity`,
// `cloud`, `refi`, `engineering`). Posts directly to `/api/subscribe`.

import { useState, useId } from 'react';
import { useTranslations } from '@/i18n';
import { NEWSLETTER_TAGS } from '@personal-website/shared/schemas/newsletter.schema';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMPACT_TAG_LABELS: Record<string, string> = {
  web3:          '#Web3',
  ai:            '#AI',
  cybersecurity: '#Sec',
  cloud:         '#Cloud',
  refi:          '#ReFi',
  engineering:   '#SysDesign',
};

export default function NewsletterForm({ source = 'blog-sidebar' }: { source?: string }) {
  const t = useTranslations('Blog');
  const uid = useId();
  const inputId = `${uid}-newsletter-email`;
  const errorId = `${uid}-newsletter-error`;

  const [email, setEmail]               = useState('');
  const [website, setWebsite]           = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['web3', 'ai']);
  const [status, setStatus]             = useState<Status>('idle');
  const [emailStatus, setEmailStatus]   = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const disabled = status === 'submitting';

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        // Keep at least 1 tag selected
        return prev.length > 1 ? prev.filter((item) => item !== tag) : prev;
      }
      return [...prev, tag];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t('newsletterInvalidEmail'));
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          tags:  selectedTags.length > 0 ? selectedTags : ['web3'],
          source,
          ...(website ? { website } : {}),
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        emailStatus?: string;
      };
      if (!res.ok || body.ok === false) {
        setStatus('error');
        setError(t('newsletterError'));
        return;
      }

      setEmailStatus(body.emailStatus ?? null);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setError(t('newsletterError'));
    }
  }

  if (status === 'success') {
    return (
      <div role="status" aria-live="polite" className="space-y-1 py-2">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          {emailStatus === 'sent'
            ? t('newsletterSuccess')
            : t('newsletterSavedNoMail')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left" aria-label={t('newsletterTitle')}>
      <div>
        <label htmlFor={inputId} className="sr-only">
          {t('newsletterEmailPlaceholder')}
        </label>
        <input
          id={inputId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('newsletterEmailPlaceholder')}
          aria-invalid={status === 'error'}
          aria-describedby={status === 'error' && error ? errorId : undefined}
          disabled={disabled}
          className="block w-full rounded-xl border border-slate-200 bg-slate-50/85 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-purple-400/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:opacity-60 dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-emerald-400/45 dark:focus:bg-white/[0.06] dark:focus:ring-emerald-400/15"
        />
      </div>

      {/* Symmetrical 3x2 Reading Segment Tag Grid */}
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Reading topics">
        {NEWSLETTER_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => toggleTag(tag)}
              className={`flex items-center justify-center rounded-lg border px-2 py-1.5 font-mono text-[11px] font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'border-purple-400/60 bg-purple-500/15 text-purple-700 dark:border-emerald-400/45 dark:bg-emerald-400/12 dark:text-emerald-300'
                  : 'border-slate-200/80 bg-slate-50/70 text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:border-white/[0.07] dark:bg-white/[0.02] dark:text-slate-400 dark:hover:border-white/[0.15] dark:hover:text-slate-200'
              }`}
            >
              {COMPACT_TAG_LABELS[tag] ?? `#${tag}`}
            </button>
          );
        })}
      </div>

      {/* Honeypot visually hidden, auto-filled by bots. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          top: 'auto',
          width: 1,
          height: 1,
          overflow: 'hidden',
        }}
      />
      <button
        type="submit"
        disabled={disabled}
        aria-disabled={disabled}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #10B981 100%)',
          boxShadow: '0 8px 24px -10px rgba(124, 58, 237, 0.55)',
        }}
      >
        <span>{disabled ? t('newsletterSubmitting') : t('newsletterSubscribe')}</span>
        {!disabled && (
          <span aria-hidden="true" className="font-mono text-xs opacity-85">
            →
          </span>
        )}
      </button>
      {status === 'error' && error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </form>
  );
}
