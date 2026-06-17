import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'my-project',
  description: 'my-project application',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
