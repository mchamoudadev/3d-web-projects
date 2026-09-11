import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Slice — One fruit, one bottle.',
  description:
    'Grown in the sun. Nothing else added. Follow the watermelon from fruit to first sip. A Dugsiiye demo brand.',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
