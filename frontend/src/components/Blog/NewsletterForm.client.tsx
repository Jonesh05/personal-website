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
    <form onSubmit={handleSubmit} noValidate className="space-y-3" aria-label={t('newsletterTitle')}>
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
        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600
          rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white
          placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none
          focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
      />

      {/* Reading Segment Tag Pills */}
      <div className="flex flex-wrap justify-center gap-1.5 pt-0.5" role="group" aria-label="Reading topics">
        {NEWSLETTER_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => toggleTag(tag)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono transition-colors cursor-pointer border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-400'
                  : 'bg-white/70 text-gray-600 border-gray-300 hover:border-blue-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
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
        className="w-full flex justify-center py-2 px-4 border border-transparent
          rounded-md shadow-sm text-sm font-medium text-white bg-blue-600
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
          focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {disabled ? t('newsletterSubmitting') : t('newsletterSubscribe')}
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
