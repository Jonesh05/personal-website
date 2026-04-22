'use client';

import { useState, useId } from 'react';
import { submitContactAction } from '@/app/actions/contacts';

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
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '10px 14px',
  color: 'var(--color-text)',
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
  const uid = useId();
  const nameId    = `${uid}-name`;
  const emailId   = `${uid}-email`;
  const messageId = `${uid}-message`;
  const statusId  = `${uid}-status`;

  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState<Status>('idle');
  const [errors,  setErrors]  = useState<Record<string, string>>({});

  const [nameFocus,    setNameFocus]    = useState(false);
  const [emailFocus,   setEmailFocus]   = useState(false);
  const [messageFocus, setMessageFocus] = useState(false);


  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim())                        next.name    = 'Name is required.';
    if (!email.trim())                       next.email   = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                             next.email   = 'Please enter a valid email.';
    if (!message.trim())                     next.message = 'Message is required.';
    else if (message.trim().length < 10)     next.message = 'Message must be at least 10 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    const fd = new FormData();
    fd.append('name', name);
    fd.append('email', email);
    fd.append('message', message);

    const result = await submitContactAction(fd);

    if (result.error) {
      setStatus('error');
    } else {
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
      setErrors({});
    }
  };

  const isSubmitting = status === 'submitting';

  return (
    <div
      className="rounded-2xl p-7"
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
            Message sent!
          </p>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Thanks for reaching out. I&apos;ll get back to you soon.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-2 px-5 py-2 rounded-full text-sm transition-all duration-200"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            Send another
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-label="Contact form"
        >
          <div className="flex flex-col gap-5">
            {/* Name */}
            <Field id={nameId} label="Your name" error={errors.name} required>
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
                placeholder="Your name"
                style={useInputStyle(nameFocus, !!errors.name)}
              />
            </Field>

            {/* Email */}
            <Field id={emailId} label="Email address" error={errors.email} required>
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
                placeholder="you@example.com"
                style={useInputStyle(emailFocus, !!errors.email)}
              />
            </Field>

            
            <Field id={messageId} label="Message" error={errors.message} required>
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
                placeholder="Tell me about your project or idea…"
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
                Something went wrong. Please try again.
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
                  Sending…
                </>
              ) : (
                <>
                  Send Message
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
