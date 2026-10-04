import { Cormorant_Garamond, Lora, Marck_Script } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: '500',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const body = Lora({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-body',
  display: 'swap',
});

const script = Marck_Script({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
});

export const metadata = {
  title: 'Для Саби',
  description: 'Письмо, которое ждёт, чтобы его открыли.',
  robots: { index: false, follow: false },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#fbf6ee',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  );
}
