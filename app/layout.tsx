import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ui/ThemeProvider';

export const metadata: Metadata = {
  title: "Adler's Forge",
  description: 'Privacy-first browser developer utilities suite.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="texture-overlay relative">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
