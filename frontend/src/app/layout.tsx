import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { AuthProvider }   from '@/components/providers/AuthProvider';
import { ThemeProvider }  from '@/components/providers/ThemeProvider';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { getServerLocale } from '@/i18n/server';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title:       'Jhonny Pimiento - Web3 & Blockchain Developer',
  description: 'Portfolio of Jhonny Pimiento, Colombian entrepreneur specializing in Web3, blockchain, and full-stack development.',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();

  return (
    // suppressHydrationWarning needed because ThemeProvider may toggle `class`
    // client-side. `lang` is now resolved server-side via cookie/accept-language.
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <AuthProvider>
              <Navbar />
              {children}
            </AuthProvider>
            <Footer />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
