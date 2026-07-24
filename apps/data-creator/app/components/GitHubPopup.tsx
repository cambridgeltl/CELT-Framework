'use client';

import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Input } from './ui/Input';
import UploadAllTabContent from './github-popup/UploadAllTabContent';
import ImportTabContent from './github-popup/ImportTabContent';
import BulkUploadTabContent from './github-popup/BulkUploadTabContent';
import GitHubTokenSlideshow from './GitHubTokenSlideshow';
import DeployGuideSlideshow from './DeployGuideSlideshow';
import CreditsModal from './CreditsModal';
import {
  GitHubConfig,
  saveGitHubConfig,
  loadGitHubConfig,
  isConfigComplete,
} from '../utils/githubApi';

const GitHubIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const HelpIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function GitHubPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);
  const [showDeployGuide, setShowDeployGuide] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [config, setConfig] = useState<Partial<GitHubConfig>>({});
  const [rememberSettings, setRememberSettings] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedConfig = loadGitHubConfig();
    if (savedConfig.owner || savedConfig.repo || savedConfig.token) {
      setConfig(savedConfig);
    }
    // Note: Auto-show onboarding is handled by Providers.tsx at the root level
  }, []);

  useEffect(() => {
    if (rememberSettings && isConfigComplete(config)) {
      saveGitHubConfig(config as GitHubConfig);
    }
  }, [config, rememberSettings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const configComplete = isConfigComplete(config);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button Group */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative p-3 rounded-xl transition-all duration-300
            ${isOpen
              ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)] shadow-[0_0_20px_rgba(95,143,139,0.15)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:shadow-[0_0_15px_rgba(95,143,139,0.1)]'
            }
          `}
          title="Export & Import"
          aria-expanded={isOpen}
        >
          <GitHubIcon />
          {/* Status dot */}
          <span className={`
            absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-bg)]
            ${configComplete ? 'bg-emerald-500 animate-statusPulse' : 'bg-amber-500'}
          `} />
        </button>
        {/* Credits Button */}
        <button
          onClick={() => setShowCredits(true)}
          className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary-light)] hover:from-[var(--color-warning)] hover:to-amber-500 text-[var(--color-primary)] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[var(--color-warning)]/20 hover:scale-105"
          title="Credits"
          aria-label="Credits"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
        {/* Deploy Guide Button */}
        <button
          onClick={() => setShowDeployGuide(true)}
          className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary-light)] hover:from-violet-500 hover:to-purple-600 text-[var(--color-primary)] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-violet-500/20 hover:scale-105"
          title="Deploy Guide"
          aria-label="Deploy Guide - Build Android App"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </button>
        {/* Help Button - Larger */}
        <button
          onClick={() => setShowTokenHelp(true)}
          className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary-light)] hover:from-[var(--color-primary)] hover:to-emerald-500 text-[var(--color-primary)] hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-[var(--color-primary)]/20 hover:scale-105"
          title="App Guide & Setup Help"
          aria-label="App Guide & Setup Help"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      {/* Popup Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-3 z-50 animate-popupIn">
          <div className="
            github-popup-panel
            rounded-2xl
            border border-[var(--color-border)]
            min-w-[360px] max-w-[90vw]
            overflow-hidden
          ">
            {/* Header */}
            <div className="
              github-popup-header
              flex items-center justify-between
              px-5 py-3.5
              border-b border-[var(--color-border)]
            ">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold tracking-wide text-[var(--color-text)]">
                    GitHub Sync
                  </span>
                </div>
                <span className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase
                  ${configComplete
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  }
                `}>
                  <span className={`w-1.5 h-1.5 rounded-full ${configComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {configComplete ? 'Connected' : 'Setup'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`
                    p-2 rounded-lg transition-all duration-200
                    ${showSettings
                      ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)] rotate-45'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover-overlay)]'
                    }
                  `}
                  title="Settings"
                >
                  <SettingsIcon />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-hover-overlay)] transition-all duration-200"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 backdrop-blur-sm animate-slideDown">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Owner"
                      value={config.owner || ''}
                      onChange={(e) => setConfig({ ...config, owner: (e.target as HTMLInputElement).value })}
                      placeholder="username"
                    />
                    <Input
                      label="Repo"
                      value={config.repo || ''}
                      onChange={(e) => setConfig({ ...config, repo: (e.target as HTMLInputElement).value })}
                      placeholder="repo-name"
                    />
                  </div>
                  <Input
                    label="Token"
                    type="password"
                    value={config.token || ''}
                    onChange={(e) => setConfig({ ...config, token: (e.target as HTMLInputElement).value })}
                    placeholder="ghp_xxxx"
                    leftIcon={<LockIcon />}
                  />
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberSettings}
                      onChange={(e) => setRememberSettings(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <span className="text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                      Remember settings
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className="p-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <Tabs defaultValue="upload-all">
                <TabsList className="mb-3 github-popup-tabs" variant="pills">
                  <TabsTrigger value="upload-all" className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    All
                  </TabsTrigger>
                  <TabsTrigger value="import" className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Import
                  </TabsTrigger>
                  <TabsTrigger value="bulk" className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    Bulk
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload-all">
                  <UploadAllTabContent />
                </TabsContent>
                <TabsContent value="import">
                  <ImportTabContent />
                </TabsContent>
                <TabsContent value="bulk">
                  <BulkUploadTabContent />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* GitHub Token Help Slideshow */}
      <GitHubTokenSlideshow
        isOpen={showTokenHelp}
        onClose={() => setShowTokenHelp(false)}
      />

      {/* Deploy Guide Slideshow */}
      <DeployGuideSlideshow
        isOpen={showDeployGuide}
        onClose={() => setShowDeployGuide(false)}
      />

      {/* Credits Modal */}
      <CreditsModal
        isOpen={showCredits}
        onClose={() => setShowCredits(false)}
      />
    </div>
  );
}
