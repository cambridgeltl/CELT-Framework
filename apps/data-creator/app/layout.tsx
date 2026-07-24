import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navigation from './components/Navigation';
import Providers from './components/Providers';
import GitHubPopup from './components/GitHubPopup';
import LanguageHeader from './components/LanguageHeader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Language Learning - Learn • Practice • Master',
  description: 'Learn any language with flashcards, dictionary, quizzes, and more',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--color-bg)] min-h-screen transition-colors duration-300`}
      >
        <Providers>
          <div className="max-w-6xl mx-auto px-4">
            <header className="py-8">
              <div className="flex items-start justify-between">
                <LanguageHeader />
                <GitHubPopup />
              </div>
            </header>
            <Navigation />
            <main className="py-8">{children}</main>
            <footer className="py-8 border-t border-[var(--color-border)] text-center text-sm text-[var(--color-text-muted)]">
              <p>Language Learning App</p>
              <p className="mt-1">Built with Next.js, TypeScript, and Tailwind CSS</p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
