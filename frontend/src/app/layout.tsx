import type { Metadata } from 'next';
import { Inter, Space_Grotesk, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { AuthProvider }   from '@/components/providers/AuthProvider';
import { ThemeProvider }  from '@/components/providers/ThemeProvider';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { getServerLocale } from '@/i18n/server';
import { ToastProvider }   from '@/components/providers/ToastProvider';
import { getSiteUrl }      from '@/lib/siteConfig';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const siteUrl = getSiteUrl();
const defaultDescription =
  'Senior Software & Web3 Engineer specializing in distributed systems, smart contracts, cloud architecture, and production AI-powered web applications.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Jhonny Pimiento — Senior Software & Web3 Engineer',
    template: '%s | Jhonny Pimiento',
  },
  description: defaultDescription,
  keywords: [
    'Jhonny Pimiento',
    'Senior Software Engineer',
    'Web3 Engineer',
    'Distributed Systems',
    'Blockchain Architecture',
    'Solidity',
    'TypeScript',
    'Next.js',
    'AWS Cloud Architecture',
    'DeFi',
  ],
  authors: [{ name: 'Jhonny Pimiento', url: siteUrl }],
  creator: 'Jhonny Pimiento',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': [
        { url: '/feed.xml', title: 'Jhonny Pimiento — Blog RSS Feed' },
      ],
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Jhonny Pimiento',
    locale: 'en_US',
    alternateLocale: ['es_CO'],
    title: 'Jhonny Pimiento — Senior Software & Web3 Engineer',
    description: defaultDescription,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@jonesh5_',
    title: 'Jhonny Pimiento — Senior Software & Web3 Engineer',
    description: defaultDescription,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();

  return (
    // suppressHydrationWarning needed because ThemeProvider may toggle `class`
    // client-side. `lang` is now resolved server-side via cookie/accept-language.
    <html
      lang={locale}
      className={`${inter.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='site-theme';var t=localStorage.getItem(k);if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}var r=document.documentElement;if(t==='dark'){r.classList.add('dark');r.classList.remove('light');}else{r.classList.add('light');r.classList.remove('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg dark:focus:bg-white dark:focus:text-slate-900"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <AuthProvider>
              <Navbar />
              {children}
              <ToastProvider />
            </AuthProvider>
            <Footer />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
