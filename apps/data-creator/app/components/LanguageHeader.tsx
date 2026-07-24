'use client';

import { useState, useEffect } from 'react';
import { getStoredLanguageName } from './GitHubTokenSlideshow';

export default function LanguageHeader() {
  const [languageName, setLanguageName] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredLanguageName();
    setLanguageName(stored !== 'Your Language' ? stored : '');

    // Listen for storage changes (in case language is updated in slideshow)
    const handleStorageChange = () => {
      const updated = getStoredLanguageName();
      setLanguageName(updated !== 'Your Language' ? updated : '');
    };

    window.addEventListener('storage', handleStorageChange);

    // Also poll for changes (for same-tab updates)
    const interval = setInterval(() => {
      const updated = getStoredLanguageName();
      setLanguageName(prev => {
        const newName = updated !== 'Your Language' ? updated : '';
        return prev !== newName ? newName : prev;
      });
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Show skeleton while mounting to avoid hydration mismatch
  if (!mounted) {
    return (
      <div>
        <div className="h-12 w-64 bg-[var(--color-primary-light)] rounded-lg animate-pulse mb-2" />
        <div className="h-6 w-48 bg-[var(--color-primary-light)]/50 rounded animate-pulse" />
      </div>
    );
  }

  const displayName = languageName || 'Language Learning';

  return (
    <div>
      <h1 className="text-5xl font-bold text-[var(--color-primary)] mb-2">
        {displayName}
      </h1>
      <p className="text-lg text-[var(--color-primary)] opacity-80">
        Learn <span className="mx-1">•</span> Practice <span className="mx-1">•</span> Master
      </p>
    </div>
  );
}
