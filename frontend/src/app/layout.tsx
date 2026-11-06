import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'VideoFinder — Universal Video Search Engine',
  description: 'Mecanismo universal para localização e inteligência de vídeos reais da internet.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-background font-sans text-on-surface antialiased min-h-screen">
        <Sidebar />
        <div className="pl-64 flex flex-col min-h-screen">
          <Header />
          <main className="w-full pt-16 flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

