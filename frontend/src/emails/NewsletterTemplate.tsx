// frontend/src/emails/NewsletterTemplate.tsx
// Minimalist, high-deliverability light-first adaptive editorial letter for jonesh.me.
//
// Design principles:
// - Light-first canvas (#FFFFFF card on #F8FAFC) with graceful `@media (prefers-color-scheme: dark)`
//   support via `<meta name="color-scheme" content="light dark">`.
// - Clean system sans-serif & monospace stacks — zero external Google Fonts.
// - No dark marketing boxes, no gradient bars, no redundant links.
// - Invisible preview-text padding so inbox snippets never pull footer/header noise.
// - Personal sign-off from Jhonny Pimiento + localized Preference Center & Unsubscribe links.

import * as React from 'react'
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'

export interface NewsletterArticleItem {
  title: string
  excerpt: string
  url: string
  tag?: string
  readTimeMinutes?: number
}

export interface NewsletterTemplateProps {
  subscriberEmail: string
  magicToken: string
  locale?: 'en' | 'es'
  subjectLine?: string
  previewText?: string
  editionNumber?: number
  metaLine?: string
  headline: string
  introParagraph: string
  /** Optional additional body paragraphs rendered below `introParagraph`. */
  paragraphs?: string[]
  codeSnippet?: string
  /** Optional multi-article digest list (omitted for single-article broadcasts to avoid duplication). */
  articles?: NewsletterArticleItem[]
  ctaLabel?: string
  ctaUrl?: string
  /** Optional personal sign-off note rendered above the signature. */
  replyHint?: string
  signOffGreeting?: string
  /** Kept in props for caller compatibility; internal subscriber segments are not rendered in the email body. */
  tags?: string[]
  baseUrl?: string
}

const PREVIEW_PADDING = '\u00A0\u200C'.repeat(40)

export function NewsletterTemplate({
  subscriberEmail,
  magicToken,
  locale = 'en',
  previewText = 'New engineering notes from jonesh.me',
  editionNumber = 0,
  metaLine,
  headline,
  introParagraph,
  paragraphs = [],
  codeSnippet,
  articles = [],
  ctaLabel,
  ctaUrl,
  replyHint,
  signOffGreeting,
  baseUrl = 'https://jonesh.me',
}: NewsletterTemplateProps) {
  const isEs = locale === 'es'
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
  const resolvedCtaUrl = ctaUrl || `${cleanBaseUrl}/blog`
  const resolvedCtaLabel = ctaLabel || (isEs ? 'Leer en jonesh.me →' : 'Read on jonesh.me →')
  const preferencesUrl = `${cleanBaseUrl}/preferences?token=${encodeURIComponent(magicToken)}`
  const unsubscribeUrl = `${cleanBaseUrl}/preferences?token=${encodeURIComponent(magicToken)}&action=unsubscribe`

  const headerBadge =
    editionNumber > 0
      ? `DISPATCH #${String(editionNumber).padStart(3, '0')}`
      : isEs
        ? 'NOTAS'
        : 'NOTES'

  const resolvedSignOffGreeting = signOffGreeting ?? (isEs ? 'Un saludo,' : 'Best,')

  return (
    <Html lang={locale} dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`
          :root { color-scheme: light dark; supported-color-schemes: light dark; }
          @media (prefers-color-scheme: dark) {
            .nl-body { background-color: #0F172A !important; color: #E2E8F0 !important; }
            .nl-container { background-color: #111827 !important; border-color: #1F2937 !important; border-top-color: #94A3B8 !important; }
            .nl-header { border-bottom-color: #1F2937 !important; }
            .nl-ink { color: #F8FAFC !important; }
            .nl-muted { color: #CBD5E1 !important; }
            .nl-subtle { color: #94A3B8 !important; }
            .nl-code { background-color: #0B1220 !important; border-color: #1F2937 !important; color: #E2E8F0 !important; }
            .nl-card { background-color: #1E293B !important; border-color: #334155 !important; }
            .nl-cta { background-color: #F8FAFC !important; color: #0F172A !important; }
            .nl-hr { border-color: #1F2937 !important; }
            .nl-footer { background-color: #0F172A !important; }
          }
        `}</style>
      </Head>
      <Preview>{`${previewText}${PREVIEW_PADDING}`}</Preview>
      <Body className="nl-body" style={styles.body}>
        <Container className="nl-container" style={styles.container}>
          {/* Minimal Editorial Header */}
          <Section className="nl-header" style={styles.header}>
            <Row>
              <Column align="left">
                <Link href={cleanBaseUrl} className="nl-ink" style={styles.brandWordmark}>
                  jonesh.me
                </Link>
              </Column>
              <Column align="right">
                <Text className="nl-subtle" style={styles.editionLabel}>
                  {headerBadge}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Editorial Letter Body */}
          <Section style={styles.contentSection}>
            {metaLine ? (
              <Text className="nl-subtle" style={styles.metaLine}>
                {metaLine}
              </Text>
            ) : null}

            <Heading as="h1" className="nl-ink" style={styles.heading}>
              {headline}
            </Heading>

            <Text className="nl-muted" style={styles.paragraph}>
              {introParagraph}
            </Text>

            {paragraphs.map((para, idx) => (
              <Text key={idx} className="nl-muted" style={styles.paragraph}>
                {para}
              </Text>
            ))}

            {codeSnippet ? (
              <Section className="nl-code" style={styles.codeBox}>
                <Text className="nl-ink" style={styles.codeText}>
                  {codeSnippet}
                </Text>
              </Section>
            ) : null}

            {/* Optional Multi-Article Digest List */}
            {articles.length > 0 ? (
              <Section style={styles.articlesWrapper}>
                {articles.map((article, idx) => (
                  <Section key={idx} className="nl-card" style={styles.articleCard}>
                    {article.tag || article.readTimeMinutes ? (
                      <Text className="nl-subtle" style={styles.articleMeta}>
                        {article.tag ? article.tag.toUpperCase() : ''}
                        {article.tag && article.readTimeMinutes ? ' · ' : ''}
                        {article.readTimeMinutes
                          ? `${article.readTimeMinutes} MIN READ`
                          : ''}
                      </Text>
                    ) : null}
                    <Heading as="h2" style={styles.articleTitle}>
                      <Link href={article.url} className="nl-ink" style={styles.articleLink}>
                        {article.title}
                      </Link>
                    </Heading>
                    {article.excerpt ? (
                      <Text className="nl-muted" style={styles.articleExcerpt}>
                        {article.excerpt}
                      </Text>
                    ) : null}
                  </Section>
                ))}
              </Section>
            ) : null}

            {/* Single Clean Call to Action */}
            <Section style={styles.ctaContainer}>
              <Button href={resolvedCtaUrl} className="nl-cta" style={styles.ctaButton}>
                {resolvedCtaLabel}
              </Button>
            </Section>

            {replyHint ? (
              <Text className="nl-subtle" style={styles.replyHint}>
                {replyHint}
              </Text>
            ) : null}

            {/* Personal Sign-Off */}
            <Text className="nl-ink" style={styles.signOff}>
              {resolvedSignOffGreeting}
              <br />
              <strong>Jhonny Pimiento</strong>
            </Text>
          </Section>

          <Hr className="nl-hr" style={styles.divider} />

          {/* Minimal Footer */}
          <Section className="nl-footer" style={styles.footer}>
            <Text className="nl-subtle" style={styles.footerText}>
              {isEs ? 'Enviado a ' : 'Sent to '}
              <span className="nl-muted" style={styles.footerEmail}>
                {subscriberEmail}
              </span>
              {isEs ? ' desde ' : ' from '}
              <Link href={cleanBaseUrl} className="nl-muted" style={styles.footerBrandLink}>
                jonesh.me
              </Link>
              .
            </Text>
            <Text className="nl-subtle" style={styles.footerLinksRow}>
              <Link href={preferencesUrl} className="nl-muted" style={styles.footerLink}>
                {isEs ? 'Gestionar preferencias' : 'Manage preferences'}
              </Link>
              {' · '}
              <Link href={unsubscribeUrl} className="nl-subtle" style={styles.footerLinkMuted}>
                {isEs ? 'Cancelar suscripción' : 'Unsubscribe'}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const SYSTEM_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const SYSTEM_MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace'

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#F8FAFC',
    color: '#111827',
    fontFamily: SYSTEM_SANS,
    margin: '0',
    padding: '32px 16px',
  },
  container: {
    maxWidth: '560px',
    margin: '0 auto',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderTop: '2px solid #18181B',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 32px 16px 32px',
    borderBottom: '1px solid #F1F5F9',
  },
  brandWordmark: {
    color: '#111827',
    fontFamily: SYSTEM_MONO,
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    textDecoration: 'none',
  },
  editionLabel: {
    margin: '0',
    fontFamily: SYSTEM_MONO,
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    color: '#6B7280',
    textAlign: 'right',
  },
  contentSection: {
    padding: '28px 32px 28px 32px',
  },
  metaLine: {
    margin: '0 0 10px 0',
    fontFamily: SYSTEM_MONO,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: '#6B7280',
  },
  heading: {
    margin: '0 0 16px 0',
    fontSize: '23px',
    lineHeight: '1.32',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#111827',
  },
  paragraph: {
    margin: '0 0 16px 0',
    fontSize: '15px',
    lineHeight: '1.7',
    color: '#374151',
  },
  codeBox: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '14px 16px',
    marginBottom: '20px',
  },
  codeText: {
    margin: '0',
    fontFamily: SYSTEM_MONO,
    fontSize: '12px',
    lineHeight: '1.6',
    color: '#111827',
    whiteSpace: 'pre-wrap',
  },
  articlesWrapper: {
    marginTop: '8px',
    marginBottom: '20px',
  },
  articleCard: {
    backgroundColor: '#F8FAFC',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '16px 18px',
    marginBottom: '12px',
  },
  articleMeta: {
    margin: '0 0 6px 0',
    fontFamily: SYSTEM_MONO,
    fontSize: '10px',
    letterSpacing: '0.06em',
    color: '#6B7280',
  },
  articleTitle: {
    margin: '0 0 6px 0',
    fontSize: '16px',
    lineHeight: '1.38',
    fontWeight: 700,
  },
  articleLink: {
    color: '#111827',
    textDecoration: 'underline',
  },
  articleExcerpt: {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#4B5563',
  },
  ctaContainer: {
    marginTop: '22px',
    marginBottom: '22px',
  },
  ctaButton: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    padding: '11px 22px',
    borderRadius: '6px',
    display: 'inline-block',
  },
  replyHint: {
    margin: '0 0 18px 0',
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#6B7280',
  },
  signOff: {
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#111827',
  },
  divider: {
    borderColor: '#F1F5F9',
    margin: '0',
  },
  footer: {
    backgroundColor: '#F8FAFC',
    padding: '18px 32px 22px 32px',
  },
  footerText: {
    margin: '0 0 6px 0',
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#6B7280',
  },
  footerEmail: {
    color: '#374151',
  },
  footerBrandLink: {
    color: '#374151',
    textDecoration: 'underline',
  },
  footerLinksRow: {
    margin: '0',
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#9CA3AF',
  },
  footerLink: {
    color: '#374151',
    textDecoration: 'underline',
  },
  footerLinkMuted: {
    color: '#6B7280',
    textDecoration: 'underline',
  },
}

export default NewsletterTemplate
