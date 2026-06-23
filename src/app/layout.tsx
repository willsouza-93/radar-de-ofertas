import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Radar de Ofertas',
  description: 'Backoffice de curadoria e aprovacao de ofertas.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
