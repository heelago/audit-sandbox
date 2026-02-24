import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'סביבת ביקורת AI',
  description: 'מערכת להערכה אקדמית באמצעות ביקורת טקסטים שנוצרו על ידי בינה מלאכותית',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
