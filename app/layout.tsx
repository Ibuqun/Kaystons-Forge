import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { DM_Sans, Playfair_Display, Fira_Code } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fira-code',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Kayston's Forge",
  description: 'Privacy-first browser developer utilities suite.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: '/icons/icon-192.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" className={`${dmSans.variable} ${playfair.variable} ${firaCode.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="texture-overlay relative">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
