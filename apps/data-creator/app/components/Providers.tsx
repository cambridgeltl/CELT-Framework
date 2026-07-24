'use client';

import React, { useState, useEffect } from 'react';
import { ToastProvider } from './ui/Toast';
import { DecksProvider } from '../contexts/DecksContext';
import { AudioStagingProvider } from '../contexts/AudioStagingContext';
import { ImageStagingProvider } from '../contexts/ImageStagingContext';
import { DictionaryProvider } from '../contexts/DictionaryContext';
import { ConversationsProvider } from '../contexts/ConversationsContext';
import { CultureProvider } from '../contexts/CultureContext';
import GitHubTokenSlideshow, { isOnboardingComplete, setOnboardingComplete } from './GitHubTokenSlideshow';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if this is first time user
    if (!isOnboardingComplete()) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingClose = () => {
    setOnboardingComplete(); // Mark as complete so it won't show again
    setShowOnboarding(false);
  };

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <ToastProvider position="top-right">
      <DecksProvider>
        <DictionaryProvider>
          <ConversationsProvider>
            <CultureProvider>
              <AudioStagingProvider>
                <ImageStagingProvider>
                  {children}
                  <GitHubTokenSlideshow
                    isOpen={showOnboarding}
                    onClose={handleOnboardingClose}
                  />
                </ImageStagingProvider>
              </AudioStagingProvider>
            </CultureProvider>
          </ConversationsProvider>
        </DictionaryProvider>
      </DecksProvider>
    </ToastProvider>
  );
}
