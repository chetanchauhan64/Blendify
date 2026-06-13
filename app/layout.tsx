import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/layout/CartDrawer';

export const metadata: Metadata = {
  title: {
    default: 'BLENDIFY | The Art of Coffee',
    template: '%s | BLENDIFY',
  },
  description: 'Premium specialty coffee sourced from the world\'s finest farms. 100% Arabica, roasted with obsessive care. Made in India.',
  keywords: ['specialty coffee', 'premium coffee', 'blendify', 'arabica', 'Indian coffee', 'flavoured coffee', 'instant coffee', 'the art of coffee'],
  authors: [{ name: 'BLENDIFY' }],
  creator: 'BLENDIFY',
  publisher: 'BLENDIFY',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://blendify.coffee',
    siteName: 'BLENDIFY',
    title: 'BLENDIFY | The Art of Coffee',
    description: 'Premium specialty coffee sourced from the world\'s finest farms. 100% Arabica. Made in India.',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'BLENDIFY — The Art of Coffee' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BLENDIFY | The Art of Coffee',
    description: 'Premium specialty coffee sourced from the world\'s finest farms. 100% Arabica. Made in India.',
    images: ['/images/og-image.jpg'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {/* 32px AnnouncementBar + 56px Navbar = 88px total */}
        <main style={{ paddingTop: '88px' }}>{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  );
}
