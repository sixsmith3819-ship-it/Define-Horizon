/**
 * Root Layout Component
 */

import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Define Horizon BMS',
  description: 'Business Management System',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <link rel='preconnect' href='https://supabase.co' />
      </head>
      <body className='bg-white text-gray-900'>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
