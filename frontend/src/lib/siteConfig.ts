// frontend/src/lib/siteConfig.ts
// Single source of truth for canonical site URL, public contact address,
// and outbound sender addresses. Keeps RSS, Preference Center links, and
// transactional emails aligned before and after a custom domain / mail
// subdomain (e.g. mail.jonesh.me) is configured.

const DEFAULT_SITE_URL = 'https://jonesh.me'
const DEFAULT_PUBLIC_CONTACT_EMAIL = 'jopimiento@gmail.com'

/**
 * Canonical site origin without a trailing slash.
 * Controlled via `NEXT_PUBLIC_SITE_URL`.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!raw) return DEFAULT_SITE_URL
  return raw.replace(/\/+$/, '')
}

/**
 * Public email address displayed in the Get In Touch card.
 * Controlled via `NEXT_PUBLIC_CONTACT_EMAIL` so it can be rotated to a custom
 * domain address without code changes.
 */
export function getPublicContactEmail(): string {
  const raw = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim()
  return raw || DEFAULT_PUBLIC_CONTACT_EMAIL
}

/**
 * Sender header ("From") for newsletter confirmation / dispatch emails.
 * Falls back to `CONTACT_NOTIFICATION_FROM`, or Resend's built-in sandbox
 * sender (`onboarding@resend.dev`) when `RESEND_API_KEY` is configured before
 * a custom domain is verified.
 */
export function getNewsletterFrom(): string {
  const configured =
    process.env.NEWSLETTER_FROM?.trim() ||
    process.env.CONTACT_NOTIFICATION_FROM?.trim()
  if (configured) return configured
  if (process.env.RESEND_API_KEY?.trim()) {
    return 'jonesh.me <onboarding@resend.dev>'
  }
  return ''
}

/**
 * Sender header ("From") for contact-form notification emails.
 */
export function getContactFrom(): string {
  return process.env.CONTACT_NOTIFICATION_FROM?.trim() || ''
}
