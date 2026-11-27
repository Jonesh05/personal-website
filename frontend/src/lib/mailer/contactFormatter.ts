// frontend/src/lib/mailer/contactFormatter.ts
// Shared, transport-agnostic formatters for contact-form emails:
// 1. Header sanitization (prevents CR/LF & control-char header injection).
// 2. Admin notification formatting (shared by SMTP and Resend drivers).
// 3. Human, light-first adaptive editorial auto-reply to the sender (EN & ES).

import type { ContactNotification } from './types'

export type ContactAutoReplyLocale = 'en' | 'es'

/**
 * Strips CR, LF, NUL, and ASCII control characters from header-bound values
 * (Subject, Reply-To, display names) to prevent SMTP/MIME header injection.
 */
export function sanitizeEmailHeaderValue(raw: string): string {
  return raw
    .replace(/[\r\n\x00-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Escapes HTML special characters for safe interpolation inside email templates.
 */
export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ---------------------------------------------------------------------------
// Admin Notification (shared by SMTP & Resend)
// ---------------------------------------------------------------------------

export function buildContactAdminSubject(name: string): string {
  const clean = sanitizeEmailHeaderValue(name).slice(0, 60) || 'a visitor'
  return `[contact] new message from ${clean}`
}

export function buildContactAdminHtml(msg: ContactNotification): string {
  const body = escapeHtml(msg.message).replace(/\n/g, '<br/>')
  return [
    '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#111827">',
    `<p><strong>From:</strong> ${escapeHtml(msg.name)} &lt;${escapeHtml(msg.email)}&gt;</p>`,
    `<p><strong>Message ID:</strong> <code>${escapeHtml(msg.id)}</code></p>`,
    '<hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0"/>',
    `<p>${body}</p>`,
    '</div>',
  ].join('')
}

export function buildContactAdminText(msg: ContactNotification): string {
  return [
    `From: ${msg.name} <${msg.email}>`,
    `Message ID: ${msg.id}`,
    '---',
    msg.message,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Sender Auto-Reply (Light-first adaptive editorial letter, EN & ES)
// ---------------------------------------------------------------------------

export interface ContactAutoReplyInput {
  name:    string
  message: string
  locale:  ContactAutoReplyLocale
  siteUrl: string
}

export interface FormattedEmail {
  subject: string
  html:    string
  text:    string
}

function extractFirstName(rawName: string): string {
  const cleaned = sanitizeEmailHeaderValue(rawName)
  const first = cleaned.split(/\s+/)[0] ?? ''
  return first.slice(0, 40)
}

function buildMessageExcerpt(rawMessage: string, maxLen = 180): string {
  const normalized = rawMessage.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLen) return normalized
  return `${normalized.slice(0, maxLen - 1).trimEnd()}…`
}

export function buildContactAutoReply(input: ContactAutoReplyInput): FormattedEmail {
  const firstName = extractFirstName(input.name)
  const snippet = buildMessageExcerpt(input.message)
  const cleanSiteUrl = input.siteUrl.replace(/\/+$/, '')
  const isEs = input.locale === 'es'

  const subject = isEs
    ? 'Recibí tu mensaje — Jhonny Pimiento'
    : 'Got your note — Jhonny Pimiento'

  const greeting = isEs
    ? (firstName ? `Hola ${firstName},` : 'Hola,')
    : (firstName ? `Hi ${firstName},` : 'Hi there,')

  const leadParagraph = isEs
    ? 'Quería confirmarte que tu mensaje llegó bien a mi bandeja. Leo personalmente cada nota que llega por jonesh.me y suelo responder en un plazo de 24 a 48 horas.'
    : 'Just a quick note to let you know your message landed safely in my inbox. I read every note that comes through jonesh.me personally and usually reply within 24–48 hours.'

  const quoteLabel = isEs ? 'Lo que me compartiste:' : 'Here is what came through:'

  const followUpParagraph = isEs
    ? 'Si quieres agregar algún enlace, contexto técnico o detalle adicional mientras lo reviso, puedes responder directamente a este correo.'
    : 'If you want to add a link, repo, or extra context while I review it, just hit reply to this email — it goes straight to me.'

  const signOffLine1 = isEs ? 'Un saludo,' : 'Best,'
  const signOffName = 'Jhonny Pimiento'
  const signOffRole = 'jonesh.me'

  const previewText = isEs
    ? 'Tu mensaje llegó bien — te responderé personalmente en 24–48 horas.'
    : 'Your message landed safely — I will reply personally within 24–48 hours.'
  const previewPadding = '\u00A0\u200C'.repeat(40)

  const html = [
    '<!doctype html>',
    `<html lang="${isEs ? 'es' : 'en'}" dir="ltr">`,
    '<head>',
    '<meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<meta name="color-scheme" content="light dark"/>',
    '<meta name="supported-color-schemes" content="light dark"/>',
    '<style>',
    ':root { color-scheme: light dark; supported-color-schemes: light dark; }',
    '@media (prefers-color-scheme: dark) {',
    '  .email-body { background-color: #0F172A !important; color: #E2E8F0 !important; }',
    '  .email-card { background-color: #111827 !important; border-color: #1F2937 !important; border-top-color: #94A3B8 !important; }',
    '  .email-ink { color: #F8FAFC !important; }',
    '  .email-muted { color: #CBD5E1 !important; }',
    '  .email-subtle { color: #94A3B8 !important; }',
    '  .email-quote { background-color: #1E293B !important; border-left-color: #64748B !important; color: #E2E8F0 !important; }',
    '  .email-hr { border-top-color: #1F2937 !important; }',
    '  .email-link { color: #E2E8F0 !important; }',
    '}',
    '</style>',
    '</head>',
    '<body class="email-body" style="margin:0;padding:32px 16px;background-color:#F8FAFC;color:#111827;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">',
    `<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${escapeHtml(previewText)}${previewPadding}</div>`,
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;margin:0 auto;">',
    '<tr><td class="email-card" style="background-color:#FFFFFF;border:1px solid #E5E7EB;border-top:2px solid #18181B;border-radius:8px;padding:32px 32px 28px 32px;">',
    `<p class="email-subtle" style="margin:0 0 24px 0;font-size:12px;font-weight:600;letter-spacing:0.04em;color:#6B7280;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;"><a href="${escapeHtml(cleanSiteUrl)}" class="email-link" style="color:#111827;text-decoration:none;">jonesh.me</a></p>`,
    `<p class="email-ink" style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:#111827;font-weight:500;">${escapeHtml(greeting)}</p>`,
    `<p class="email-muted" style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#374151;">${escapeHtml(leadParagraph)}</p>`,
    `<p class="email-subtle" style="margin:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.02em;color:#6B7280;">${escapeHtml(quoteLabel)}</p>`,
    `<blockquote class="email-quote" style="margin:0 0 20px 0;padding:12px 16px;background-color:#F9FAFB;border-left:2px solid #CBD5E1;border-radius:4px;font-size:14px;line-height:1.6;color:#374151;">&ldquo;${escapeHtml(snippet)}&rdquo;</blockquote>`,
    `<p class="email-muted" style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#374151;">${escapeHtml(followUpParagraph)}</p>`,
    `<p class="email-ink" style="margin:0;font-size:15px;line-height:1.6;color:#111827;">${escapeHtml(signOffLine1)}<br/><strong>${escapeHtml(signOffName)}</strong><br/><a href="${escapeHtml(cleanSiteUrl)}" class="email-subtle" style="color:#6B7280;text-decoration:none;font-size:13px;">${escapeHtml(signOffRole)}</a></p>`,
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>',
  ].join('')

  const text = [
    greeting,
    '',
    leadParagraph,
    '',
    quoteLabel,
    `> "${snippet}"`,
    '',
    followUpParagraph,
    '',
    signOffLine1,
    signOffName,
    cleanSiteUrl,
  ].join('\n')

  return { subject, html, text }
}
