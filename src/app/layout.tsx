import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

// Self-hosted Poppins (no Google Fonts network call at runtime —
// works offline in dev and production behind proxies/firewalls).
const poppins = localFont({
  src: [
    { path: './fonts/poppins-latin-300.woff2', weight: '300', style: 'normal' },
    { path: './fonts/poppins-latin-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins-latin-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins-latin-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/poppins-latin-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/poppins-latin-800.woff2', weight: '800', style: 'normal' },
    { path: './fonts/poppins-latin-ext-300.woff2', weight: '300', style: 'normal' },
    { path: './fonts/poppins-latin-ext-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/poppins-latin-ext-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/poppins-latin-ext-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/poppins-latin-ext-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/poppins-latin-ext-800.woff2', weight: '800', style: 'normal' },
  ],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EstateFlow CRM | Real Estate Lead & Booking Management',
  description: 'Enterprise Real Estate CRM for sales teams to track leads, pipelines, property inventory, and conflict-free unit bookings.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${poppins.className} h-full antialiased`} suppressHydrationWarning>
      <body className={`min-h-full flex flex-col bg-background text-foreground ${poppins.className}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
