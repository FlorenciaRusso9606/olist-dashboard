import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '../providers/QueryProvider';

export const metadata: Metadata = {
  title: 'Olist Dashboard',
  description: 'Dashboard comercial — Olist Brazilian E-Commerce',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <QueryProvider>
          <nav className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center gap-8">
              <span className="font-bold text-lg text-blue-600">Olist Dashboard</span>
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Overview</a>
              <a href="/rankings" className="text-sm text-gray-600 hover:text-gray-900">Rankings</a>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-6 py-8">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}