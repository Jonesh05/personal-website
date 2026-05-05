'use client';

// Interactive bits of the BlogSidebar newsletter widget. The heading/body
// stay in the server component so SSR renders the visible copy without a
// client bundle cost; only the form state lives here.

import { useState, useId } from 'react';
import { useTranslations } from '@/i18n';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm({ source = 'blog-sidebar' }: { source?: string }) {
  const t = useTranslations('Blog');
  const uid = useId();
  const inputId = `${uid}-newsletter-email`;
  const errorId = `${uid}-newsletter-error`;

  const [email, setEmail]     = useState('');
  const [status, setStatus]   = useState<Status>('idle');
  const [error, setError]     = useState<string | null>(null);

  const disabled = status === 'submitting';

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
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source }),
      });

      const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || body.ok === false) {
        setStatus('error');
        setError(t('newsletterError'));
        return;
      }

      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setError(t('newsletterError'));
    }
  }

  if (status === 'success') {
    return (
      <p
        role="status"
        aria-live="polite"
        className="text-sm font-medium text-green-700 dark:text-green-400 py-2"
      >
        {t('newsletterSuccess')}
      </p>
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
      {/* Honeypot — visually hidden, auto-filled by bots. */}
      <input
        type="text"
        name="website"
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
