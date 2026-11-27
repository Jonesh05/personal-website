'use client';

import { useState, useId } from 'react';
import { useLocale, useTranslations } from '@/i18n';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ id, label, error, required, children }: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
      >
        {label}
        {required && (
          <span aria-hidden="true" style={{ color: 'var(--color-purple-neon)', marginLeft: '4px' }}>
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs"
          style={{ color: '#f87171', fontFamily: 'var(--font-mono)' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: '100%',
  background: 'var(--color-surface-elev-2)',
  border: '1px solid var(--color-border-soft)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: 'var(--color-fg)',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};
const inputFocus: React.CSSProperties = {
  borderColor: 'rgba(191, 94, 255, 0.6)',
  boxShadow: '0 0 0 3px rgba(191, 94, 255, 0.2)',
};
const inputError: React.CSSProperties = {
  borderColor: 'rgba(248, 113, 113, 0.6)',
  boxShadow: '0 0 0 3px rgba(248, 113, 113, 0.15)',
};

function useInputStyle(focused: boolean, hasError: boolean): React.CSSProperties {
  if (hasError) return { ...inputBase, ...inputError };
  if (focused)  return { ...inputBase, ...inputFocus };
  return inputBase;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const t = useTranslations('Contact');
  const { locale } = useLocale();
  const uid = useId();
  const nameId    = `${uid}-name`;
  const emailId   = `${uid}-email`;
  const messageId = `${uid}-message`;
  const statusId  = `${uid}-status`;

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [status,  setStatus]  = useState<Status>('idle');
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const [nameFocus,    setNameFocus]    = useState(false);
  const [emailFocus,   setEmailFocus]   = useState(false);
  const [messageFocus, setMessageFocus] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim())                        next.name    = t('err_name');
    if (!email.trim())                       next.email   = t('err_email_req');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                             next.email   = t('err_email_fmt');
    if (!message.trim())                     next.message = t('err_msg_req');
    else if (message.trim().length < 10)     next.message = t('err_msg_short');
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          locale,
          ...(website ? { website } : {}),
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        fieldErrors?: Record<string, string[]>;
      };

      if (!res.ok || body.ok === false) {
        if (res.status === 400 && body.fieldErrors) {
          const next: Record<string, string> = {};
          for (const [k, v] of Object.entries(body.fieldErrors)) {
            if (v && v.length > 0) next[k] = v[0];
          }
          setErrors(next);
        }
        setStatus('error');
        return;
      }

      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setWebsite('');
      setErrors({});
    } catch {
      setStatus('error');
    }
  };

  const isSubmitting = status === 'submitting';

  return (
    <div
      className="relative rounded-2xl p-7"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="absolute top-0 inset-x-0 h-px rounded-t-2xl"
        style={{
          background: 'linear-gradient(90deg, transparent, #059669, #00FFB2, transparent)',
        }}
        aria-hidden="true"
      />

      {status === 'success' ? (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center justify-center gap-4 py-12 text-center"
        >
          <span
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)' }}
            aria-hidden="true"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--color-green-neon)' }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--color-text)' }}>
            {t('form_success_h')}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            {t('form_success_p')}
          </p>
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="mt-2 px-5 py-2 rounded-full text-sm transition-all duration-200 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 dark:bg-white/[0.05] dark:border-white/10 dark:text-[color:var(--color-text-muted)] dark:hover:bg-white/10"
            style={{
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            {t('form_again')}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label={t('section_label')}
        >
          <div className="flex flex-col gap-5">
            {/* Name */}
            <Field id={nameId} label={t('form_name')} error={errors.name} required>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => setNameFocus(true)}
                onBlur={() => setNameFocus(false)}
                required
                autoComplete="name"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? `${nameId}-error` : undefined}
                placeholder={t('form_name')}
                style={useInputStyle(nameFocus, !!errors.name)}
              />
            </Field>

            {/* Email */}
            <Field id={emailId} label={t('form_email')} error={errors.email} required>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                required
                autoComplete="email"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? `${emailId}-error` : undefined}
                placeholder={t('placeholder_email')}
                style={useInputStyle(emailFocus, !!errors.email)}
              />
            </Field>

            {/* Message */}
            <Field id={messageId} label={t('form_message')} error={errors.message} required>
              <textarea
                id={messageId}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onFocus={() => setMessageFocus(true)}
                onBlur={() => setMessageFocus(false)}
                required
                rows={5}
                aria-required="true"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? `${messageId}-error` : undefined}
                placeholder={t('placeholder_message')}
                style={{ ...useInputStyle(messageFocus, !!errors.message), resize: 'vertical' }}
              />
              {/* Character hint */}
              <p
                className="text-right text-xs"
                style={{ color: message.length < 10 ? 'var(--color-text-faint)' : 'var(--color-green-neon)', fontFamily: 'var(--font-mono)' }}
                aria-live="polite"
              >
                {message.length} / 10 min
              </p>
            </Field>

            {/* Anti-spam honeypot */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={e => setWebsite(e.target.value)}
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

            {/* Error banner */}
            {status === 'error' && (
              <div
                id={statusId}
                role="alert"
                aria-live="assertive"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm"
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  color: '#fca5a5',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {t('form_error')}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              className="relative w-full flex items-center justify-center gap-2 rounded-xl py-3 px-6 font-semibold text-sm transition-all duration-300 focus:outline-none"
              style={{
                background: isSubmitting ? 'rgba(124,58,237,0.4)' : 'var(--gradient-plasma)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                boxShadow: isSubmitting ? 'none' : '0 0 28px rgba(124,58,237,0.4)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
              onFocus={e => {
                if (!isSubmitting)
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(191,94,255,0.5), 0 0 28px rgba(124,58,237,0.4)';
              }}
              onBlur={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = isSubmitting ? 'none' : '0 0 28px rgba(124,58,237,0.4)';
              }}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin"
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  {t('form_sending')}
                </>
              ) : (
                <>
                  {t('form_send')}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
