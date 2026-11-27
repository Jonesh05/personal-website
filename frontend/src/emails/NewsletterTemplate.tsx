// frontend/src/emails/NewsletterTemplate.tsx
// Minimal editorial React Email template aligned with the jonesh.me visual
// identity (Plasma Void palette: #04080F / #080E18 / #9B3FFB / #10B981).
//
// Rendered strictly on the server via `@react-email/render` or passed directly
// to the Resend SDK. Includes dynamic Preference Center & Unsubscribe links
// authenticated via `magicToken`.

import * as React from 'react'
import {
  Body,
  Button,
  Column,
  Container,
  Font,
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
  subjectLine?: string
  previewText?: string
  editionNumber?: number
  headline: string
  introParagraph: string
  codeSnippet?: string
  articles?: NewsletterArticleItem[]
  ctaLabel?: string
  ctaUrl?: string
  /** Kept in props for caller compatibility; internal subscriber segments are not rendered in the email body. */
  tags?: string[]
  baseUrl?: string
}

export function NewsletterTemplate({
  subscriberEmail,
  magicToken,
  previewText = 'New engineering notes from jonesh.me',
  editionNumber = 0,
  headline,
  introParagraph,
  codeSnippet,
  articles = [],
  ctaLabel = 'Read on jonesh.me →',
  ctaUrl,
  baseUrl = 'https://jonesh.me',
}: NewsletterTemplateProps) {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
  const resolvedCtaUrl = ctaUrl || `${cleanBaseUrl}/blog`
  const preferencesUrl = `${cleanBaseUrl}/preferences?token=${encodeURIComponent(magicToken)}`
  const unsubscribeUrl = `${cleanBaseUrl}/preferences?token=${encodeURIComponent(magicToken)}&action=unsubscribe`
  const headerBadge =
    editionNumber > 0
      ? `DISPATCH #${String(editionNumber).padStart(3, '0')}`
      : 'JOURNAL'

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: 'https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZOIHTWEBlw.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="sans-serif"
          webFont={{
            url: 'https://fonts.gstatic.com/s/dmsans/v15/rP2Hp2ywxg089UriCZ2IHjWEBlw.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
        <Font
          fontFamily="JetBrains Mono"
          fallbackFontFamily="monospace"
          webFont={{
            url: 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOV.woff2',
            format: 'woff2',
          }}
          fontWeight={500}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Signature Plasma Accent Bar */}
          <Section style={styles.accentBar} />

          {/* Minimal Brand Header */}
          <Section style={styles.header}>
            <Row>
              <Column align="left">
                <Link href={cleanBaseUrl} style={styles.brandWordmark}>
                  jonesh<span style={styles.brandDot}>.me</span>
                </Link>
              </Column>
              <Column align="right">
                <Text style={styles.editionLabel}>{headerBadge}</Text>
              </Column>
            </Row>
          </Section>

          {/* Main Editorial Frame */}
          <Section style={styles.contentSection}>
            <Heading as="h1" style={styles.heading}>
              {headline}
            </Heading>

            <Text style={styles.paragraph}>{introParagraph}</Text>

            {codeSnippet && (
              <Section style={styles.codeBox}>
                <Text style={styles.codeText}>{codeSnippet}</Text>
              </Section>
            )}

            {/* Featured Articles */}
            {articles.length > 0 && (
              <Section style={styles.articlesWrapper}>
                {articles.map((article, idx) => (
                  <Section key={idx} style={styles.articleCard}>
                    {(article.tag || article.readTimeMinutes) && (
                      <Text style={styles.articleMeta}>
                        {article.tag ? (
                          <span style={styles.articleCategory}>
                            {article.tag.toUpperCase()}
                          </span>
                        ) : null}
                        {article.tag && article.readTimeMinutes ? '  ·  ' : ''}
                        {article.readTimeMinutes
                          ? `${article.readTimeMinutes} MIN READ`
                          : ''}
                      </Text>
                    )}
                    <Heading as="h2" style={styles.articleTitle}>
                      <Link href={article.url} style={styles.articleLink}>
                        {article.title}
                      </Link>
                    </Heading>
                    {article.excerpt && (
                      <Text style={styles.articleExcerpt}>
                        {article.excerpt}
                      </Text>
                    )}
                    <Text style={styles.articleReadMoreRow}>
                      <Link href={article.url} style={styles.articleReadMore}>
                        Read article →
                      </Link>
                    </Text>
                  </Section>
                ))}
              </Section>
            )}

            {/* Primary Call to Action */}
            <Section style={styles.ctaContainer}>
              <Button href={resolvedCtaUrl} style={styles.ctaButton}>
                {ctaLabel}
              </Button>
            </Section>
          </Section>

          <Hr style={styles.divider} />

          {/* Clean, Minimal Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Sent to <span style={styles.footerEmail}>{subscriberEmail}</span>{' '}
              from{' '}
              <Link href={cleanBaseUrl} style={styles.footerBrandLink}>
                jonesh.me
              </Link>
              .
            </Text>
            <Text style={styles.footerLinksRow}>
              <Link href={preferencesUrl} style={styles.footerLink}>
                Manage preferences
              </Link>
              {'  ·  '}
              <Link href={unsubscribeUrl} style={styles.footerLinkMuted}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#04080F',
    color: '#E8F0FE',
    fontFamily:
      '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: '0',
    padding: '36px 12px',
  },
  container: {
    maxWidth: '580px',
    margin: '0 auto',
    backgroundColor: '#080E18',
    border: '1px solid #1A2640',
    borderRadius: '14px',
    overflow: 'hidden',
  },
  accentBar: {
    height: '3px',
    backgroundColor: '#9B3FFB',
    backgroundImage: 'linear-gradient(90deg, #9B3FFB 0%, #10B981 100%)',
  },
  header: {
    padding: '22px 32px 18px 32px',
    borderBottom: '1px solid #1A2640',
  },
  brandWordmark: {
    color: '#E8F0FE',
    fontSize: '16px',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    textDecoration: 'none',
  },
  brandDot: {
    color: '#00FFB2',
  },
  editionLabel: {
    margin: '0',
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.08em',
    color: '#7A8FAD',
    textAlign: 'right',
  },
  contentSection: {
    padding: '32px 32px 28px 32px',
  },
  heading: {
    margin: '0 0 14px 0',
    fontSize: '24px',
    lineHeight: '1.3',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#E8F0FE',
  },
  paragraph: {
    margin: '0 0 24px 0',
    fontSize: '15px',
    lineHeight: '1.68',
    color: '#B4C2D9',
  },
  codeBox: {
    backgroundColor: '#04080F',
    border: '1px solid #1A2640',
    borderLeft: '3px solid #9B3FFB',
    borderRadius: '8px',
    padding: '14px 16px',
    marginBottom: '24px',
  },
  codeText: {
    margin: '0',
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    lineHeight: '1.6',
    color: '#00FFB2',
    whiteSpace: 'pre-wrap',
  },
  articlesWrapper: {
    marginTop: '8px',
    marginBottom: '24px',
  },
  articleCard: {
    backgroundColor: '#0D1524',
    border: '1px solid #1A2640',
    borderRadius: '10px',
    padding: '20px 22px',
    marginBottom: '14px',
  },
  articleMeta: {
    margin: '0 0 8px 0',
    fontFamily:
      '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '10px',
    letterSpacing: '0.08em',
    color: '#7A8FAD',
  },
  articleCategory: {
    color: '#BF5EFF',
  },
  articleTitle: {
    margin: '0 0 8px 0',
    fontSize: '17px',
    lineHeight: '1.38',
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  articleLink: {
    color: '#E8F0FE',
    textDecoration: 'none',
  },
  articleExcerpt: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#7A8FAD',
  },
  articleReadMoreRow: {
    margin: '0',
    fontSize: '13px',
    fontWeight: 600,
  },
  articleReadMore: {
    color: '#00FFB2',
    textDecoration: 'none',
  },
  ctaContainer: {
    marginTop: '8px',
    marginBottom: '4px',
  },
  ctaButton: {
    backgroundColor: '#7C3AED',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    textDecoration: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    display: 'inline-block',
  },
  divider: {
    borderColor: '#1A2640',
    margin: '0',
  },
  footer: {
    backgroundColor: '#060B14',
    padding: '20px 32px 24px 32px',
  },
  footerText: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#7A8FAD',
  },
  footerEmail: {
    color: '#B4C2D9',
  },
  footerBrandLink: {
    color: '#B4C2D9',
    textDecoration: 'none',
  },
  footerLinksRow: {
    margin: '0',
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#3D4F6E',
  },
  footerLink: {
    color: '#BF5EFF',
    textDecoration: 'underline',
  },
  footerLinkMuted: {
    color: '#7A8FAD',
    textDecoration: 'underline',
  },
}

export default NewsletterTemplate
