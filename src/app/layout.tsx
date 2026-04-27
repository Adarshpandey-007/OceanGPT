import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NavigationHeader } from '../components/layout/NavigationHeader';
import { OceanFooter } from '../components/layout/OceanFooter';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FloatChat',
  description: 'Oceanographic data exploration & conversion',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased min-h-screen flex flex-col bg-floatchat-bg text-floatchat-ink`}>
        <NavigationHeader />
        <main id="main" className="flex-1 focus:outline-none">
          {children}
        </main>
        <OceanFooter />
      </body>
    </html>
  );
}
